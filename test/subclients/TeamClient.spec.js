import { expect } from 'chai'
import faker from 'faker'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import build from '../support/builders'
import data from '../support/data'
import { onConstructionOf } from '../support/dsls/construction'
import { forInstance } from '../support/dsls/methods'

import TeamClient from '../../src/subclients/TeamClient'
import { bearerAuthHeader } from '../../src/support/http'

const buildValidTeamClient = () => {
  const apiUrl = 'https://concourse.example.com'
  const bearerToken = data.randomBearerToken()

  const httpClient = axios.create({
    headers: bearerAuthHeader(bearerToken)
  })
  const mock = new MockAdapter(httpClient)

  const teamId = data.randomId()
  const teamName = data.randomTeamName()
  const team = build.client.team(data.randomTeam({
    id: teamId,
    name: teamName
  }))

  const client = new TeamClient({apiUrl, httpClient, team})

  return {
    client,
    mock,
    apiUrl,
    bearerToken,
    team
  }
}

describe('TeamClient', () => {
  describe('construction', () => {
    it('throws an exception if the API URI is not provided', () => {
      onConstructionOf(TeamClient)
        .withArguments({teamId: 1})
        .throwsError('Invalid parameter(s): ["apiUrl" is required].')
    })

    it('throws an exception if the API URI is not a string', () => {
      onConstructionOf(TeamClient)
        .withArguments({teamId: 1, apiUrl: 25})
        .throwsError('Invalid parameter(s): ["apiUrl" must be a string].')
    })

    it('throws an exception if the API URI is not a valid URI', () => {
      onConstructionOf(TeamClient)
        .withArguments({teamId: 1, apiUrl: 'spinach'})
        .throwsError('Invalid parameter(s): ["apiUrl" must be a valid uri].')
    })

    it('throws an exception if the provided HTTP client is not an object',
      () => {
        onConstructionOf(TeamClient)
          .withArguments({
            teamId: 1,
            apiUrl: faker.internet.url(),
            httpClient: 35
          })
          .throwsError(
            'Invalid parameter(s): ["httpClient" must be a Function].')
      })

    it('throws an exception if the team is not provided', () => {
      onConstructionOf(TeamClient)
        .withArguments({apiUrl: faker.internet.url()})
        .throwsError('Invalid parameter(s): ["team" is required].')
    })

    it('throws an exception if the team is not an object', () => {
      onConstructionOf(TeamClient)
        .withArguments({apiUrl: faker.internet.url(), team: 'wat'})
        .throwsError('Invalid parameter(s): ["team" must be an object].')
    })
  })

  describe('listPipelines', () => {
    it('gets all pipelines for team',
      async () => {
        const {client, mock, apiUrl, bearerToken, team} =
          buildValidTeamClient()

        const teamName = team.name
        const pipelineData = data.randomPipeline({teamName})

        const pipelineFromApi = build.api.pipeline(pipelineData)
        const pipelinesFromApi = [pipelineFromApi]

        const convertedPipeline = build.client.pipeline(pipelineData)
        const expectedPipelines = [convertedPipeline]

        mock.onGet(
          `${apiUrl}/teams/${teamName}/pipelines`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(200, pipelinesFromApi)

        const actualPipelines = await client.listPipelines()

        expect(actualPipelines).to.eql(expectedPipelines)
      })
  })

  describe('getPipeline', () => {
    it('throws an exception if the pipeline name is not provided',
      async () => {
        const {client} = buildValidTeamClient()
        await forInstance(client)
          .onCallOf('getPipeline')
          .withNoArguments()
          .throwsError('Invalid parameter(s): ["pipelineName" is required].')
      })

    it('throws an exception if the pipeline name is not a string',
      async () => {
        const {client} = buildValidTeamClient()
        await forInstance(client)
          .onCallOf('getPipeline')
          .withArguments(12345)
          .throwsError(
            'Invalid parameter(s): ["pipelineName" must be a string].')
      })

    it('gets the pipeline with the specified name',
      async () => {
        const {client, mock, apiUrl, bearerToken, team} =
          buildValidTeamClient()

        const teamName = team.name
        const pipelineName = data.randomPipelineName()
        const pipelineData = data.randomPipeline({
          teamName,
          name: pipelineName
        })

        const pipelineFromApi = build.api.pipeline(pipelineData)

        const expectedPipeline = build.client.pipeline(pipelineData)

        mock.onGet(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(200, pipelineFromApi)

        const actualPipeline = await client.getPipeline(pipelineName)

        expect(actualPipeline).to.eql(expectedPipeline)
      })
  })

  describe('deletePipeline', () => {
    it('throws an exception if the pipeline name is not provided',
      async () => {
        const {client} = buildValidTeamClient()
        await forInstance(client)
          .onCallOf('deletePipeline')
          .withNoArguments()
          .throwsError(
            'Invalid parameter(s): ["pipelineName" is required].')
      })

    it('throws an exception if the pipeline name is not a string',
      async () => {
        const {client} = buildValidTeamClient()
        await forInstance(client)
          .onCallOf('deletePipeline')
          .withArguments(12345)
          .throwsError(
            'Invalid parameter(s): ["pipelineName" must be a string].')
      })

    it('deletes the pipeline with the specified name',
      async () => {
        const {client, mock, apiUrl, bearerToken, team} =
          buildValidTeamClient()

        const teamName = team.name
        const pipelineName = data.randomPipelineName()

        mock.onDelete(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(204)

        await client.deletePipeline(pipelineName)
        expect(mock.history.delete).to.have.length(1)

        const call = mock.history.delete[0]
        expect(call.url)
          .to.eql(`${apiUrl}/teams/${teamName}/pipelines/${pipelineName}`)
        expect(call.headers)
          .to.include(bearerAuthHeader(bearerToken))
      })

    it('throws the underlying http client exception on failure',
      async () => {
        const {client, mock, apiUrl, bearerToken, team} =
          buildValidTeamClient()

        const teamName = team.name
        const pipelineName = data.randomPipelineName()

        mock.onDelete(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .networkError()

        try {
          await client.deletePipeline(pipelineName)
        } catch (e) {
          expect(e).to.be.instanceOf(Error)
          expect(e.message).to.eql('Network Error')
        }
      })
  })
})
