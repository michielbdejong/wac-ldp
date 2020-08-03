import { ErrorResult, ResultType } from '../api/http/HttpResponder'
import { WacLdpTask } from '../api/http/HttpParser'
import { RdfLayer } from '../rdf/RdfLayer'
import { ResourceData } from '../rdf/ResourceDataUtils'

export async function getResourceDataAndCheckETag (wacLdpTask: WacLdpTask, rdfLayer: RdfLayer): Promise<ResourceData | undefined> {
  const resourceData = await rdfLayer.getResourceData(wacLdpTask.fullUrl())
  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match
  const resultTypeToUse = (wacLdpTask.appliesServerSideChanges() ? ResultType.PreconditionFailed : ResultType.NotModified)

  if (resourceData) { // resource exists
    if (wacLdpTask.ifNoneMatchStar()) { // If-None-Match: * -> resource should not exist
      throw new ErrorResult(resultTypeToUse)
    }
    const ifMatch = wacLdpTask.ifMatch()
    if (ifMatch && resourceData.etag !== ifMatch) { // If-Match -> ETag should match
      throw new ErrorResult(resultTypeToUse)
    }
    const ifNoneMatchList: Array<string> | undefined = wacLdpTask.ifNoneMatchList()
    if (ifNoneMatchList && ifNoneMatchList.indexOf(resourceData.etag) !== -1) { // ETag in blacklist
      throw new ErrorResult(resultTypeToUse)
    }
  } else { // resource does not exist
    if (wacLdpTask.ifMatch()) { // If-Match -> ETag should match so resource should first exist
      throw new ErrorResult(resultTypeToUse)
    }
  }
  return resourceData
}
