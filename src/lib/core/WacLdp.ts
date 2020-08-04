import * as http from 'http'
import Debug from 'debug'
import { BlobTree } from '../storage/BlobTree'
import { WacLdpTask } from '../api/http/HttpParser'
import { sendHttpResponse, WacLdpResponse, ErrorResult, ResultType } from '../api/http/HttpResponder'
import { optionsHandler } from '../operationHandlers/optionsHandler'
import { EventEmitter } from 'events'
import { RdfLayer } from '../rdf/RdfLayer'
import { CachingRdfLayer } from '../rdf/CachingRdfLayer'
import { globReadHandler } from '../operationHandlers/globReadHandler'
import { containerMemberAddHandler } from '../operationHandlers/containerMemberAddHandler'
import { readContainerHandler } from '../operationHandlers/readContainerHandler'
import { deleteContainerHandler } from '../operationHandlers/deleteContainerHandler'
import { readBlobHandler } from '../operationHandlers/readBlobHandler'
import { writeBlobHandler } from '../operationHandlers/writeBlobHandler'
import { updateBlobHandler } from '../operationHandlers/updateBlobHandler'
import { deleteBlobHandler } from '../operationHandlers/deleteBlobHandler'
import { unknownOperationCatchAll } from '../operationHandlers/unknownOperationCatchAll'
import { checkAccess, determineRequiredAccessModes, AccessCheckTask } from './checkAccess'
import { getAppModes } from '../auth/appIsTrustedForMode'
import { setAppModes } from '../rdf/setAppModes'

export const BEARER_PARAM_NAME = 'bearer_token'

const debug = Debug('app')

function partAfterLastSlash (str: string) {
  const parts = str.split('/')
  return parts[parts.length - 1]
}

function addBearerToken (baseUrl: URL, bearerToken: string | undefined): URL {
  const ret = new URL(baseUrl.toString())
  if (bearerToken) {
    ret.searchParams.set(BEARER_PARAM_NAME, bearerToken)
  }
  return ret
}
interface OperationHandler {
  canHandle: (wacLdpTask: WacLdpTask) => boolean
  handle: (wacLdpTask: WacLdpTask, rdfLayer: RdfLayer, aud: string, skipWac: boolean, appendOnly: boolean) => Promise<WacLdpResponse>
}

export class WacLdp extends EventEmitter {
  aud: string
  rdfLayer: RdfLayer
  updatesViaUrl: URL
  skipWac: boolean
  operationHandlers: Array<OperationHandler>
  idpHost: string
  usesHttps: boolean
  constructor (storage: BlobTree, aud: string, updatesViaUrl: URL, skipWac: boolean, idpHost: string, usesHttps: boolean) {
    super()
    this.rdfLayer = new CachingRdfLayer(aud, storage)
    this.aud = aud
    this.updatesViaUrl = updatesViaUrl
    this.skipWac = skipWac
    this.idpHost = idpHost
    this.usesHttps = usesHttps
    this.operationHandlers = [
      optionsHandler,
      globReadHandler,
      containerMemberAddHandler,
      readContainerHandler,
      deleteContainerHandler,
      readBlobHandler,
      writeBlobHandler,
      updateBlobHandler,
      deleteBlobHandler,
      unknownOperationCatchAll
    ]
  }
  setRootAcl (storageRoot: URL, owner: URL) {
    return this.rdfLayer.setRootAcl(storageRoot, owner)
  }
  setPublicAcl (inboxUrl: URL, owner: URL, modeName: string) {
    return this.rdfLayer.setPublicAcl(inboxUrl, owner, modeName)
  }
  createLocalDocument (url: URL, contentType: string, body: string) {
    return this.rdfLayer.createLocalDocument(url, contentType, body)
  }
  async handleOperation (task: WacLdpTask): Promise<WacLdpResponse> {
    for (let i = 0; i < this.operationHandlers.length; i++) {
      if (this.operationHandlers[i].canHandle(task)) {
        let appendOnly = false
        if (!this.skipWac) {
          appendOnly = await checkAccess({
            url: task.fullUrl(),
            isContainer: task.isContainer(),
            webId: await task.webId(),
            // FIXME: https://github.com/michielbdejong/wac-ldp/issues/1
            // origin: await task.origin(),
            origin: await task.originFromHeaders(),
            requiredAccessModes: determineRequiredAccessModes(task.wacLdpTaskType()),
            rdfLayer: this.rdfLayer
          } as AccessCheckTask) // may throw if access is denied
        }
        debug('calling operation handler', i, task, this.rdfLayer, this.aud, this.skipWac, appendOnly)
        return this.operationHandlers[i].handle(task, this.rdfLayer, this.aud, this.skipWac, appendOnly)
      }
    }
    throw new ErrorResult(ResultType.InternalServerError)
  }
  async containerExists (url: URL): Promise<boolean> {
    return this.rdfLayer.localContainerExists(url)
  }

  async handler (httpReq: http.IncomingMessage, httpRes: http.ServerResponse): Promise<void> {
    debug(`\n\n`, httpReq.method, httpReq.url, httpReq.headers)

    let response: WacLdpResponse
    let storageOrigin: string | undefined
    let requestOrigin: string | undefined
    let bearerToken: string | undefined
    let aclPath: string | undefined
    try {
      const wacLdpTask: WacLdpTask = new WacLdpTask(this.aud, httpReq, this.usesHttps)
      storageOrigin = wacLdpTask.storageOrigin()
      requestOrigin = await wacLdpTask.origin()
      bearerToken = wacLdpTask.bearerToken()
      aclPath = (wacLdpTask.isContainer() ? '.acl' : partAfterLastSlash(wacLdpTask.fullUrl().toString()) + '.acl')
      response = await this.handleOperation(wacLdpTask)
      debug('resourcesChanged', response.resourceData)
      if (response.resourcesChanged) {
        response.resourcesChanged.forEach((url: URL) => {
          debug('emitting change event', url)
          this.emit('change', { url })
        })
      }
    } catch (error) {
      debug('errored', error)
      if (error.resultType) {
        debug('error has a responseStatus', error.resultType)
        response = error as WacLdpResponse
      } else {
        debug('error has no resultType', error.message, error)
        response = new ErrorResult(ResultType.InternalServerError) as unknown as WacLdpResponse
      }
    }
    try {
      debug('response is', response)
      return sendHttpResponse(response, {
        updatesVia: addBearerToken(this.updatesViaUrl, bearerToken),
        storageOrigin,
        idpHost: this.idpHost,
        originToAllow: requestOrigin || '*',
        aclPath
      }, httpRes)
    } catch (error) {
      debug('errored while responding', error)
    }
  }
  getTrustedAppModes (webId: URL, origin: string) {
    return getAppModes(webId, origin, this.rdfLayer)
  }
  setTrustedAppModes (webId: URL, origin: string, modes: Array<URL>) {
    return setAppModes(webId, origin, modes, this.rdfLayer.storage)
  }
  async hasAccess (webId: URL, origin: string, url: URL, mode: URL): Promise<boolean> {
    if (this.skipWac) {
      debug('hasAccess skipped due to skipWac option')
      return true
    }
    debug('hasAccess calls checkAccess', {
      url,
      webId,
      origin,
      requiredAccessModes: [ mode ],
      rdfLayer: 'this.rdfLayer'
    })
    try {
      const appendOnly = await checkAccess({
        url,
        webId,
        origin,
        requiredAccessModes: [ mode ],
        rdfLayer: this.rdfLayer
      })
      debug({ appendOnly })
      return !appendOnly
    } catch (e) {
      debug('access check error was thrown, so returning no to hasAccess question')
      return false
    }
  }
}

export function makeHandler (storage: BlobTree, aud: string, updatesViaUrl: URL, skipWac: boolean, idpHost: string, usesHttps: boolean) {
  const wacLdp = new WacLdp(storage, aud, updatesViaUrl, skipWac, idpHost, usesHttps)
  return wacLdp.handler.bind(wacLdp)
}
