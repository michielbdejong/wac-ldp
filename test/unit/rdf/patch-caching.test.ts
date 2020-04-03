import * as fs from 'fs'
import { CachingRdfLayer } from '../../../src/lib/rdf/CachingRdfLayer'
import { requestThatFails, existingTurtle, triplesAfter } from '../../fixtures/patch-bug-3'
import { RdfType } from '../../../src/lib/rdf/ResourceDataUtils'
import { toChunkStream } from '../helpers/toChunkStream'
import { BlobTree, urlToPath } from '../../../src/lib/storage/BlobTree'

const kv: {[pathStr: string]: { rdfType: RdfType, body: string } } = {
  'v1/lolcalhost.de/storage/michiel5/profile/card': { rdfType: RdfType.Turtle, body: existingTurtle }
}

const storage = {
  getBlob: jest.fn((path) => {
    return {
      getData: jest.fn(() => {
        return toChunkStream(JSON.stringify({
          rdfType: kv[path.toString()].rdfType,
          body: kv[path.toString()].body,
          etag: '"foo"'
        }))
      }),
      exists: jest.fn(() => {
        return (typeof kv[path] !== 'undefined')
      })
    }
  })
}
const rdfLayer = new CachingRdfLayer('https://lolcalhost.de', storage as unknown as BlobTree)

const triplesExpected = {
  'v1/lolcathost.de/michiel5/profile/card': triplesAfter
}

afterEach(() => {
  storage.getBlob.mock.calls = []
})

test('executes a sparql-update PATCH', async () => {
  const url = new URL('https://lolcalhost.de/storage/michiel5/profile/card')
  const resourceData = storage.getBlob(urlToPath(url)).getData()
  const sparqlQuery = requestThatFails
  const result = await rdfLayer.applyPatch(resourceData, sparqlQuery, url, false)
  expect(result.split('\n').map((str: string) => str.trim())).toEqual([
    '@prefix : <#>.',
    '@prefix fri: <https://lolcathost.de/storage/michiel5/friends-eb3563b2-8329-450d-91d8-5bfad56b8c2d#>.',
    '@prefix ldp: <http://www.w3.org/ns/ldp#>.',
    '@prefix fr: <https://lolcathost.de/storage/michiel5/friend-requests-inbox/>.',
    '@prefix c: <https://lolcathost.de/storage/michiel5/profile/card#>.',
    '@prefix n0: <https://www.w3.org/TR/activitypub/#>.',
    '',
    'fri:this ldp:inbox fr:.',
    '',
    'c:me n0:following fri:this.',
    '',
    ''
  ])
})
