import { Destination } from '../../lib/destination-kit'

import config from './destination.json'
import settings from './settings.schema.json'
import createUpdateOrganization from './createUpdateOrganization'
import createUpdatePerson from './createUpdatePerson'
import deletePerson from './deletePerson'

const destination = new Destination(config)
  .validateSettings(settings)

  .extendRequest(({ settings }) => ({
    prefixUrl: `https://${settings.domain}.pipedrive.com/api/v1/`,
    searchParams: {
      api_token: settings.apiToken
    },
    responseType: 'json'
  }))

  .apiKeyAuth({
    testCredentials: req => req('users/me')
  })

  .partnerAction('createUpdateOrganization', createUpdateOrganization)
  .partnerAction('createUpdatePerson', createUpdatePerson)
  .partnerAction('deletePerson', deletePerson)

export default destination