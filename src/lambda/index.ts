import { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from 'aws-lambda'
import AWS from 'aws-sdk'
import https, { RequestOptions } from 'https'

export async function handler(event: CloudFormationCustomResourceEvent): Promise<void> {
  console.log(JSON.stringify(event))

  let distributionId: string | undefined
  let success = true
  let reason = ''
  try {
    distributionId = await handleCustomResourceEvent(event)
  } catch (e) {
    console.log(e)
    success = false
    reason = e.message
  }

  const result = await sendResponse(event.ResponseURL, {
    Status: success ? 'SUCCESS' : 'FAILED',
    Reason: reason,
    RequestId: event.RequestId,
    StackId: event.StackId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: distributionId || 'none',
  })
  console.log(JSON.stringify(result))
}

async function handleCustomResourceEvent(
  event: CloudFormationCustomResourceEvent
): Promise<string> {
  const distributionId = event.ResourceProperties.distributionId
  if (!distributionId) {
    throw new Error('distributionId is required')
  }

  if (event.RequestType === 'Create' || event.RequestType === 'Update') {
    await invalidate(distributionId)
  }

  return distributionId
}

async function invalidate(distributionId: string): Promise<unknown> {
  const cloudfront = new AWS.CloudFront()
  const params = {
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ['/*'],
      },
    },
  }
  const result = await cloudfront.createInvalidation(params).promise()

  const invalidationId = result.Invalidation?.Id
  if (!invalidationId) {
    throw new Error('failed to get the invalidationId')
  }

  return cloudfront
    .waitFor('invalidationCompleted', {
      DistributionId: distributionId,
      Id: invalidationId,
    })
    .promise()
}

async function sendResponse(url: string, response: CloudFormationCustomResourceResponse) {
  const body = JSON.stringify(response)
  console.log(JSON.stringify({ message: 'sending response', body }))
  return urlRequest(url, body, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': body.length,
    },
  })
}

async function urlRequest(url: string, body: string | undefined, options: RequestOptions) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chunks: any[] = []
      res.on('data', (data) => chunks.push(data))
      res.on('end', () => {
        const statusCode = res.statusCode
        if (statusCode && statusCode >= 200 && statusCode <= 299) {
          resolve(Buffer.concat(chunks).toString())
        } else {
          reject(new Error(`statusCode: ${statusCode}`))
        }
      })
    })
    req.on('error', reject)

    if (body) {
      req.write(body)
    }
    req.end()
  })
}
