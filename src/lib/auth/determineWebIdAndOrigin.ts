import jwt from 'jsonwebtoken'
import Debug from 'debug'
import fetch, { Response } from 'node-fetch'
import RSA from 'node-rsa'
import { URL } from 'url'

const debug = Debug('determineWebId')

const jwksCache: { [domain: string]: { keys: Array<any> } | undefined } = {}

function urlToDomain (urlStr: string): string {
  debug('constructing URL', urlStr)
  const url = new URL(urlStr)
  return url.host
}

async function fetchIssuerJWKS (domain: string): Promise<any> {
  debug('fetching', `https://${domain}/.well-known/openid-configuration`)
  const openIdConfigResponse: Response = await fetch(`https://${domain}/.well-known/openid-configuration`)
  const openIdConfig = await openIdConfigResponse.json()
  debug('openIdConfig', openIdConfig)
  debug('fetching', openIdConfig.jwks_uri)
  const jwksResponse = await fetch(openIdConfig.jwks_uri)
  const jwks = await jwksResponse.json()
  debug('jwks', jwks)
  return jwks
}

async function getIssuerJWKS (domain: string): Promise<{ keys: Array<any> } | undefined> {
  if (!jwksCache[domain]) {
    jwksCache[domain] = await fetchIssuerJWKS(domain)
  }
  return jwksCache[domain]
}

async function getIssuerPubKey (domain: string, kid: string): Promise<string | undefined> {
  const jwks: { keys: Array<any> } | undefined = await getIssuerJWKS(domain)
  if (jwks === undefined || !Array.isArray(jwks.keys)) {
    debug('could not fetch jwks', domain)
    return
  }
  debug('unfiltered', jwks)
  const filtered = jwks.keys.filter(key => key.kid === kid)
  if (filtered.length !== 1) {
    debug('could not locate kid', jwks, kid)
    return
  }
  debug('filtered', filtered)

  const pubKeyComponents = {
    e: Buffer.from(filtered[0].e, 'base64'),
    n: Buffer.from(filtered[0].n, 'base64')
  }
  debug('pubKeyComponents', pubKeyComponents)
  const rsaPubKey: RSA = new RSA()
  rsaPubKey.importKey(pubKeyComponents, 'components-public')
  const publicPem: string = rsaPubKey.exportKey('pkcs1-public-pem')
  debug('publicPem', publicPem)
  return publicPem
}

export async function determineWebIdAndOrigin (bearerToken: string | undefined, originFromHeaders: string | undefined): Promise<{ webId: URL | undefined, origin: string | undefined }> {
  debug('determineWebId', bearerToken)
  if (!bearerToken) {
    return { webId: undefined, origin: originFromHeaders }
  }
  try {
    debug('bearerToken before decoding', bearerToken)
    const payload: any = jwt.decode(bearerToken) // decode only the payload
    debug('bearerToken payload after decoding', payload)
    let idToken: any
    let idTokenAud: string
    let originToReturn: any
    if (payload.token_type === 'id') {
      debug('WARNING! test suite sends id_token as bearer!')
      idToken = bearerToken
      idTokenAud = payload.aud
    } else {
      idToken = payload.id_token
      idTokenAud = payload.iss
    }
    const completeIdToken: any = jwt.decode(idToken, { complete: true }) // decode payload + header + signature
    debug('decoded idToken complete', completeIdToken)

    const domain: string = urlToDomain(completeIdToken.payload.sub as string)
    const issuerPubKey = await getIssuerPubKey(domain, completeIdToken.header.kid as string)
    if (!issuerPubKey) {
      debug('could not determine issuer pub key', completeIdToken)
      return { webId: undefined, origin: originFromHeaders }
    }
    try {
      debug('verifying id token', issuerPubKey, idTokenAud)
      jwt.verify(idToken, issuerPubKey, { audience: idTokenAud })
    } catch (error) {
      debug('verification failed', error.message)
      return { webId: undefined, origin: originFromHeaders }
    }
    debug('payload.id_token after decoding and verifying:', completeIdToken)
    if (payload.token_type === 'id') {
      debug('WARNING! test suite sends id_token as bearer!')
    } else {
      // originToReturn = completeIdToken.payload.iss
      originToReturn = completeIdToken.payload.aud
    }

    debug('returning', completeIdToken.payload.sub, originToReturn)
    return {
      webId: new URL(completeIdToken.payload.sub),
      origin: originToReturn
    }
  } catch (error) {
    debug(error)
  }
  return { webId: undefined, origin: originFromHeaders }
}
