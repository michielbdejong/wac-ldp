import * as fs from 'fs'
import * as http from 'http'
import { makeHandler } from '../../src/lib/core/WacLdp'
import { BlobTreeInMem } from '../../src/lib/storage/BlobTreeInMem'
import { toChunkStream } from '../unit/helpers/toChunkStream'
import { objectToStream, makeResourceData, streamToObject } from '../../src/lib/rdf/ResourceDataUtils'
import { urlToPath, BlobTree } from '../../src/lib/storage/BlobTree'
import { getBearerToken } from '../fixtures/bearerToken'
import MockDate from 'mockdate'

let storage: BlobTree
let handler: any
beforeEach(() => {
  storage = new BlobTreeInMem()
  handler = makeHandler(storage, 'https://jackson.solid.community', new URL('wss://jackson.solid.community/'), false, 'localhost:8443')
  MockDate.set(1434319925275)
})
afterEach(() => {
  MockDate.reset()
})

test('handles a PUT request by a trusted app', async () => {
  const aclDoc = fs.readFileSync('test/fixtures/aclDoc-readwrite-owner.ttl')
  const publicContainerAclDocData = await objectToStream(makeResourceData('text/turtle', aclDoc.toString()))
  await storage.getBlob(urlToPath(new URL('https://jackson.solid.community/foo/.acl'))).setData(publicContainerAclDocData)

  let streamed = false
  let endCallback: () => void
  let httpReq: any = toChunkStream('asdf')
  const { bearerToken } = getBearerToken(true)
  httpReq.headers = {
    'content-type': 'text/plain',
    'authorization': 'Bearer ' + bearerToken
  } as http.IncomingHttpHeaders
  httpReq.url = '/foo/bar' as string
  httpReq.method = 'PUT'
  httpReq = httpReq as http.IncomingMessage
  const httpRes = {
    writeHead: jest.fn(() => { }), // tslint:disable-line: no-empty
    end: jest.fn(() => { }) // tslint:disable-line: no-empty
  }
  await handler(httpReq, httpRes as unknown as http.ServerResponse)
  expect(httpRes.writeHead.mock.calls).toEqual([
    [
      201,
      {
        'Accept-Patch': 'application/sparql-update',
        'Accept-Post': 'application/sparql-update',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Authorization, User, Location, Link, Vary, Last-Modified, ETag, Accept-Patch, Accept-Post, Updates-Via, Allow, WAC-Allow, Content-Length, WWW-Authenticate',
        'Allow': 'GET, HEAD, POST, PUT, DELETE, PATCH',
        'Content-Type': 'text/plain',
        'Link': '<.acl>; rel="acl", <.meta>; rel="describedBy", <http://www.w3.org/ns/ldp#Resource>; rel="type"; <https://localhost:8443>; rel="http://openid.net/specs/connect/1.0/issuer"; <https://jackson.solid.community/.well-known/solid>; rel="service"',
        'Location': 'https://jackson.solid.community/foo/bar',
        'Updates-Via': 'wss://jackson.solid.community/?bearer_token=' + bearerToken
      }
    ]
  ])
  expect(httpRes.end.mock.calls).toEqual([
    [ 'Created' ]
  ])
  const result = await storage.getBlob(urlToPath(new URL('https://jackson.solid.community/foo/bar'))).getData()
  expect(await streamToObject(result)).toEqual(makeResourceData('text/plain', 'asdf'))
})

test.skip('rejects a PUT request by an untrusted app', async () => {
  const aclDoc = fs.readFileSync('test/fixtures/aclDoc-readwrite.ttl')
  const publicContainerAclDocData = await objectToStream(makeResourceData('text/turtle', aclDoc.toString()))
  await storage.getBlob(urlToPath(new URL('http://localhost:8080/foo/.acl'))).setData(publicContainerAclDocData)

  let streamed = false
  let endCallback: () => void
  let httpReq: any = toChunkStream('asdf')
  httpReq.headers = {
    'Content-Type': 'text/plain'
  } as http.IncomingHttpHeaders
  httpReq.url = '/foo/bar' as string
  httpReq.method = 'PUT'
  httpReq = httpReq as http.IncomingMessage
  const httpRes = {
    writeHead: jest.fn(() => { }), // tslint:disable-line: no-empty
    end: jest.fn(() => { }) // tslint:disable-line: no-empty
  }
  await handler(httpReq, httpRes as unknown as http.ServerResponse)
  expect(httpRes.writeHead.mock.calls).toEqual([
    [
      401,
      {
        'Accept-Patch': 'application/sparql-update',
        'Accept-Post': 'application/sparql-update',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Authorization, User, Location, Link, Vary, Last-Modified, ETag, Accept-Patch, Accept-Post, Updates-Via, Allow, WAC-Allow, Content-Length, WWW-Authenticate',
        'Allow': 'GET, HEAD, POST, PUT, DELETE, PATCH',
        'Content-Type': 'text/plain',
        'Link': '<.acl>; rel="acl", <.meta>; rel="describedBy", <http://www.w3.org/ns/ldp#Resource>; rel="type"; <https://localhost:8443>; rel="http://openid.net/specs/connect/1.0/issuer"; <http://localhost:8080/.well-known/solid>; rel="service"',
        'Location': 'http://localhost:8080/foo/bar',
        'Updates-Via': 'wss://localhost:8080/'
      }
    ]
  ])
  expect(httpRes.end.mock.calls).toEqual([
    [ 'Access Denied' ]
  ])
  const result = await storage.getBlob(urlToPath(new URL('http://localhost:8080/foo/bar'))).getData()
  expect(await streamToObject(result)).toEqual(makeResourceData('text/plain', 'asdf'))
})
