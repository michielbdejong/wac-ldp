import jwt from 'jsonwebtoken'
import fs from 'fs'
const privateKey = fs.readFileSync('./test/fixtures/rs256-key1/jwtRS256.key')

export function getBearerToken (correct: boolean): { expectedWebId: URL, bearerToken: string, aud: string } {
  const bearerToken: string = jwt.sign({
    iss: 'https://pheyvaer.github.io',
    aud: 'https://jackson.solid.community',
    exp: 1560773897,
    iat: 1560770297,
    id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InhlT2plczl1M0FjVTRMQnpjYW5FTTdwWkx3U2x4YU43VTYyWnpPQkRRdXcifQ.eyJzdWIiOiJodHRwczovL2phY2tzb24uc29saWQuY29tbXVuaXR5L3Byb2ZpbGUvY2FyZCNtZSIsIm5vbmNlIjoiWHpxaUdTajFWS3ZtYlBnSmlWN0FQaG1aNUhyZVNpX2NPbE1CMm5pN2t2WSIsInNpZCI6ImFlOTk3NDM1LTIyY2QtNDJmNC1hZDY3LTZiYzY0ZDUyMzRkYSIsImF0X2hhc2giOiJkR0JXQzVudFNQcmZhdzMwSWV0YW9RIiwic19oYXNoIjoieDRXRUwyY3g1a0lNd0tEdWVqdDNzdyIsImNuZiI6eyJhbGciOiJSUzI1NiIsImUiOiJBUUFCIiwiZXh0Ijp0cnVlLCJrZXlfb3BzIjpbInZlcmlmeSJdLCJrdHkiOiJSU0EiLCJuIjoieDhDNmdLcE1wMlh5NXRFVkQ5N2ROX0gwTnJXVTZWNG9KZjNzYkVpVEJwaW9oZ1VxSl93cWJ5TzQ4emZDeXNLNHM5ZVo3MmR1bTZLMXBibERFY1hMd183R21Cb2dTVmJtaGU4YlBpMkZ1SjNrR0JvdWNHNDVrWkw1MTBXWEdpclBJbmIxUHVIQzNRWjJqVHZBb0Q5ZEluOWtEMzg0UGgxd2lzRnJMTW0xQmd2bTNSZzM5TlBNSm1WRGZfcWkwb0c1RDRDcGRiUzBPdVE1Zm55UWtjRHZObW5GUUgwMFYyNDRMcWRvVjFtQm4xVXZxNi1IREozb2FaT1h5M0ZmQnRnRXVwVHBHa3BtTmZJcWVlbk9KUzBsXzg1RE51THdSRmgtUll4Ql9lQk05MUl6dFp0cWpLTzZrTW1UdVZuRnpEMm1OdERzRHV6MU5LSHlHMklzdW1wRUFRIn0sImF1ZCI6Imh0dHBzOi8vcGhleXZhZXIuZ2l0aHViLmlvIiwiZXhwIjoxNTYwNzczODkyLCJpYXQiOjE1NjA3NzAyOTIsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0Ojg0NDMifQ.YXS42Xemasj6DRNe4Gy-Zw00h-zESoXFq5aSTGs0rJb0LS2GawdOk_bHGteVk0sKuK_dXhlygR_Cx3j8q6BeRX1SLwOJJr-78vFY0UuGfoF6LIrc3WRizB2khdKvYPa58WH96Rm4bPZ5UYO53bqLbq4z4VXU4o_m-QoS7TPKfCKQUgxdoGRBTYygeLsblwtT3ytpaxcb1AV1Xs_sXXnzZj2sBqDhiK7OFcvcOn-0iL_MEMKMUTX_0sgI0lsFHmNpvkpSxBOcNeU_X9aYQxazwUzcucI3yqCQXjoNkI-awl32xVD_wnH7aXw_QI5T9MIrHF8oWYpaEZz-q7HmdEQUkA',
    token_type: 'pop'
  }, privateKey, { algorithm: 'RS256' })

  return {
    expectedWebId: new URL('https://jackson.solid.community/profile/card#me'),
    bearerToken: (correct ? bearerToken : bearerToken.substring(0, 100)),
    aud: 'https://pheyvaer.github.io'
  }
}
