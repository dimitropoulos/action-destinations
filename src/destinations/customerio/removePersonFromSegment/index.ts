import segmentIdAutocomplete from '../autocomplete/segment_id'
import { ActionDefinition } from '@/lib/destination-kit/action'
import { Settings } from '../generated-types'
import { RemovePersonFromSegment } from './generated-types'

const definition: ActionDefinition<Settings, RemovePersonFromSegment> = {
  schema: {
    $schema: 'http://json-schema.org/schema#',
    title: 'Remove Person from Segment',
    description: 'Remove a person from a segment in Customer.io.',
    type: 'object',
    additionalProperties: false,
    properties: {
      segment_id: {
        title: 'Segment ID',
        description: 'ID of the Customer.io segment to remove the person from.',
        type: 'number',
        autocomplete: true
      },
      person_id: {
        title: 'Person ID',
        description: 'ID of the person to remove.',
        type: 'string',
        defaultMapping: {
          '@template': '{{userId}}'
        }
      }
    },
    required: ['segment_id', 'person_id']
  },

  autocompleteFields: {
    segment_id: segmentIdAutocomplete
  },

  perform: (req, { payload }) => {
    return req.post(`segments/${payload.segment_id}/remove_customers`, {
      json: {
        ids: [payload.person_id]
      }
    })
  }
}

export default definition
