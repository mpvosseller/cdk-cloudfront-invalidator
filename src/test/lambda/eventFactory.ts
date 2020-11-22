import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceEventCommon,
} from 'aws-lambda'

function commonProperties({
  ResponseURL,
  distributionId,
}: {
  ResponseURL: string
  distributionId?: string
}): CloudFormationCustomResourceEventCommon {
  return {
    ServiceToken: 'someServiceToken',
    ResponseURL,
    StackId: 'someStackId',
    RequestId: 'someRequestId',
    LogicalResourceId: 'someLogicalResourceId',
    ResourceType: 'someResourceType',
    ResourceProperties: {
      ServiceToken: 'someServiceToken',
      distributionId,
    },
  }
}

export function createEvent({
  RequestType,
  ResponseURL,
  distributionId,
}: {
  RequestType: 'Create' | 'Update' | 'Delete'
  ResponseURL: string
  distributionId?: string
}): CloudFormationCustomResourceEvent {
  const props = commonProperties({ ResponseURL, distributionId })
  switch (RequestType) {
    case 'Create':
      return {
        RequestType,
        ...props,
      }
    case 'Update':
      return {
        RequestType,
        ...props,
        PhysicalResourceId: 'somePhysicalId',
        OldResourceProperties: {},
      }
    case 'Delete':
      return {
        RequestType,
        ...props,
        PhysicalResourceId: 'somePhysicalId',
      }
  }
}
