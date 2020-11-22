/* eslint-disable @typescript-eslint/no-explicit-any */
import { CloudFront } from 'aws-sdk'
import nock from 'nock'
import { mocked } from 'ts-jest/utils'
import { handler } from '../../lambda/index'
import { createEvent } from './eventFactory'

const responseBaseUrl = 'https://localhost'
const responsePath = '/some/path'

const CloudFrontMock = mocked(CloudFront, true)
const createInvalidationMock = CloudFrontMock.prototype.createInvalidation
const waitForMock = CloudFrontMock.prototype.waitFor

beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(console, 'log').mockImplementation(jest.fn()) // disable console.log()
})

function setup({
  requestType = 'Create',
  omitsDistributionId = false,
  responseStatusCode = 200,
}: {
  requestType?: 'Create' | 'Update' | 'Delete'
  omitsDistributionId?: boolean
  responseStatusCode?: number
} = {}) {
  // event
  const distributionId = omitsDistributionId ? undefined : 'someDistributionId'
  const event = createEvent({
    RequestType: requestType,
    ResponseURL: `${responseBaseUrl}${responsePath}`,
    distributionId,
  })

  // invalidation
  const invalidationId = 'someInvalidationId'
  createInvalidationMock.mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Invalidation: {
        Id: invalidationId,
      },
    }),
  } as any)

  // invalidation waiting
  waitForMock.mockReturnValue({
    promise: jest.fn(),
  } as any)

  // success/failure reporting
  let status = 'SUCCESS'
  let reason = ''
  if (omitsDistributionId) {
    status = 'FAILED'
    reason = 'distributionId is required'
  }

  const expectedBody = JSON.stringify({
    Status: status,
    Reason: reason,
    RequestId: event.RequestId,
    StackId: event.StackId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: event.ResourceProperties.distributionId ?? 'none',
  })
  const scope = nock(responseBaseUrl)
    .matchHeader('Content-Length', `${expectedBody.length}`)
    .matchHeader('Content-Type', 'application/json; charset=utf-8')
    .put(responsePath, expectedBody)
    .reply(responseStatusCode)

  return {
    event,
    invalidationId,
    scope,
    distributionId,
  }
}

function expectCloudFrontInvalidationToBeCalledTimes(times: number): void {
  expect(createInvalidationMock).toBeCalledTimes(times)
  expect(waitForMock).toBeCalledTimes(times)
}

function expectCloudFrontInvalidationToBeCalledWith({
  distributionId,
  invalidationId,
}: {
  distributionId: string
  invalidationId: string
}): void {
  expect(createInvalidationMock).toBeCalledWith(
    expect.objectContaining({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: expect.stringMatching(/\d+/),
        Paths: {
          Quantity: 1,
          Items: ['/*'],
        },
      },
    })
  )

  expect(waitForMock).toBeCalledWith('invalidationCompleted', {
    DistributionId: distributionId,
    Id: invalidationId,
  })
}

test('reports success when there are no errors', async () => {
  const { event, scope } = setup()
  await handler(event)
  expect(scope.isDone()).toBe(true)
})

test('reports failure when the distributionId is missing', async () => {
  const { event, scope } = setup({ omitsDistributionId: true })
  await handler(event)
  expect(scope.isDone()).toBe(true)
})

test('performs a CloudFront invalidation on Create events', async () => {
  const { event, distributionId, invalidationId } = setup({ requestType: 'Create' })
  if (!distributionId) {
    fail('distributionId expected to be defined')
  }
  await handler(event)
  expectCloudFrontInvalidationToBeCalledTimes(1)
  expectCloudFrontInvalidationToBeCalledWith({ distributionId, invalidationId })
})

test('performs a CloudFront invalidation on Update events', async () => {
  const { event, distributionId, invalidationId } = setup({ requestType: 'Update' })
  if (!distributionId) {
    fail('distributionId expected to be defined')
  }
  await handler(event)
  expectCloudFrontInvalidationToBeCalledTimes(1)
  expectCloudFrontInvalidationToBeCalledWith({ distributionId, invalidationId })
})

test('does NOT perform a CloudFront invalidation on Delete events', async () => {
  const { event } = setup({ requestType: 'Delete' })
  await handler(event)
  expectCloudFrontInvalidationToBeCalledTimes(0)
})

test('raises an exception when the reporting service returns a < 200 response', async () => {
  const { event } = setup({ responseStatusCode: 199 })
  const promise = handler(event)
  await expect(promise).rejects.toThrow('statusCode: 199')
})

test('does NOT raise an exception when the reporting service returns a 200 response', async () => {
  const { event } = setup({ responseStatusCode: 200 })
  await handler(event)
})

test('does NOT raise an exception when the reporting service returns a 299 response', async () => {
  const { event } = setup({ responseStatusCode: 299 })
  await handler(event)
})

test('raises an exception when the reporting service returns a > 299 response', async () => {
  const { event } = setup({ responseStatusCode: 300 })
  const promise = handler(event)
  await expect(promise).rejects.toThrow('statusCode: 300')
})
