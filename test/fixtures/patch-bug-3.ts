export const requestThatFails = `INSERT DATA {\
  <https://lolcathost.de/storage/michiel5/profile/card#me> <https://www.w3.org/TR/activitypub/#following> <https://lolcathost.de/storage/michiel5/friends-eb3563b2-8329-450d-91d8-5bfad56b8c2d#this>.\n\
  <https://lolcathost.de/storage/michiel5/friends-eb3563b2-8329-450d-91d8-5bfad56b8c2d#this> <http://www.w3.org/ns/ldp#inbox> <https://lolcathost.de/storage/michiel5/friend-requests-inbox/>.\n\
}`

const before = [
  [ 'https://lolcathost.de/storage/michiel5/profile/card#me', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://schema.org/Person' ],
  [ 'https://lolcathost.de/storage/michiel5/profile/card#me', 'http://www.w3.org/ns/pim/space#storage', 'https://lolcathost.de/storage/michiel5/' ],
  [ 'https://lolcathost.de/storage/michiel5/profile/card#me', 'http://www.w3.org/ns/ldp#inbox', 'https://lolcathost.de/storage/michiel5/inbox/' ],
  [ 'https://lolcathost.de/storage/michiel5/profile/card#me', 'http://www.w3.org/ns/auth/acl#trustedApp', 'https://lolcathost.de/storage/michiel5/profile/card#same-origin' ],
  [ 'https://lolcathost.de/storage/michiel5/profile/card#same-origin', 'http://www.w3.org/ns/auth/acl#origin', 'https://lolcathost.de' ],
  [ 'https://lolcathost.de/storage/michiel5/profile/card#same-origin', 'http://www.w3.org/ns/auth/acl#mode', 'http://www.w3.org/ns/auth/acl#Read' ],
  [ 'https://lolcathost.de/storage/michiel5/profile/card#same-origin', 'http://www.w3.org/ns/auth/acl#mode', 'http://www.w3.org/ns/auth/acl#Write' ],
  [ 'https://lolcathost.de/storage/michiel5/profile/card#same-origin', 'http://www.w3.org/ns/auth/acl#mode', 'http://www.w3.org/ns/auth/acl#Control' ]
]
export const existingTurtle = `
<https://lolcathost.de/storage/michiel5/profile/card#me> <http://www.w3.org/ns/pim/space#storage> <https://lolcathost.de/storage/michiel5/> .
<https://lolcathost.de/storage/michiel5/profile/card#me> <http://www.w3.org/ns/ldp#inbox> <https://lolcathost.de/storage/michiel5/inbox/> .
<https://lolcathost.de/storage/michiel5/profile/card#me> <http://www.w3.org/ns/auth/acl#trustedApp> <https://lolcathost.de/storage/michiel5/profile/card#same-origin> .
<https://lolcathost.de/storage/michiel5/profile/card#same-origin> <http://www.w3.org/ns/auth/acl#origin> <https://lolcathost.de> .
<https://lolcathost.de/storage/michiel5/profile/card#same-origin> <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Read> .
<https://lolcathost.de/storage/michiel5/profile/card#same-origin> <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Write> .
<https://lolcathost.de/storage/michiel5/profile/card#same-origin> <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Control> .
`

const add = [
  [ 'https://lolcathost.de/storage/michiel5/profile/card#me', 'https://www.w3.org/TR/activitypub/#following', 'https://lolcathost.de/storage/michiel5/friends-eb3563b2-8329-450d-91d8-5bfad56b8c2d#this' ],
  [ 'https://lolcathost.de/storage/michiel5/friends-eb3563b2-8329-450d-91d8-5bfad56b8c2d#this', 'http://www.w3.org/ns/ldp#inbox', 'https://lolcathost.de/storage/michiel5/friend-requests-inbox/' ]
]

export const triplesAfter = before.concat(add)
export const turtleAfter = `
<https://lolcathost.de/storage/michiel5/profile/card#me> <http://www.w3.org/ns/pim/space#storage> <https://lolcathost.de/storage/michiel5/> .
<https://lolcathost.de/storage/michiel5/profile/card#me> <http://www.w3.org/ns/ldp#inbox> <https://lolcathost.de/storage/michiel5/inbox/> .
<https://lolcathost.de/storage/michiel5/profile/card#me> <http://www.w3.org/ns/auth/acl#trustedApp> <https://lolcathost.de/storage/michiel5/profile/card#same-origin> .
<https://lolcathost.de/storage/michiel5/profile/card#same-origin> <http://www.w3.org/ns/auth/acl#origin> <https://lolcathost.de> .
<https://lolcathost.de/storage/michiel5/profile/card#same-origin> <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Read> .
<https://lolcathost.de/storage/michiel5/profile/card#same-origin> <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Write> .
<https://lolcathost.de/storage/michiel5/profile/card#same-origin> <http://www.w3.org/ns/auth/acl#mode> <http://www.w3.org/ns/auth/acl#Control> .
<https://lolcathost.de/storage/michiel5/profile/card#me> <https://www.w3.org/TR/activitypub/#following> <https://lolcathost.de/storage/michiel5/friends-eb3563b2-8329-450d-91d8-5bfad56b8c2d#this> .
<https://lolcathost.de/storage/michiel5/friends-eb3563b2-8329-450d-91d8-5bfad56b8c2d#this> <http://www.w3.org/ns/ldp#inbox> <https://lolcathost.de/storage/michiel5/friend-requests-inbox/> .
`
