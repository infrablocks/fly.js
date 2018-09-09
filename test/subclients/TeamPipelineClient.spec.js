import axios from 'axios'
import faker from 'faker'
import MockAdapter from 'axios-mock-adapter'

import data from '../testsupport/data'
import build from '../testsupport/builders'

import { onConstructionOf } from '../testsupport/dsls/construction'

import { bearerAuthHeader } from '../../src/support/http/headers'
import TeamPipelineClient from '../../src/subclients/TeamPipelineClient'
import { expect } from 'chai'
import { forInstance } from '../testsupport/dsls/methods'

const buildValidTeamPipelineClient = () => {
  const apiUrl = data.randomApiUrl()
  const bearerToken = data.randomBearerToken()

  const httpClient = axios.create({
    headers: bearerAuthHeader(bearerToken)
  })
  const mock = new MockAdapter(httpClient)

  const team = build.client.team(data.randomTeam())
  const pipeline = build.client.pipeline(data.randomPipeline())

  const client = new TeamPipelineClient({ apiUrl, httpClient, team, pipeline })

  return {
    client,
    httpClient,
    mock,
    apiUrl,
    bearerToken,
    team,
    pipeline
  }
}

describe('TeamPipelineClient', () => {
  describe('construction', () => {
    it('throws an exception if the API URI is not provided', () => {
      onConstructionOf(TeamPipelineClient)
        .withArguments({
          team: data.randomTeam(),
          pipeline: data.randomPipeline(),
          httpClient: axios
        })
        .throwsError('Invalid parameter(s): ["apiUrl" is required].')
    })

    it('throws an exception if the API URI is not a string', () => {
      onConstructionOf(TeamPipelineClient)
        .withArguments({
          apiUrl: 25,
          team: data.randomTeam(),
          pipeline: data.randomPipeline(),
          httpClient: axios
        })
        .throwsError('Invalid parameter(s): ["apiUrl" must be a string].')
    })

    it('throws an exception if the API URI is not a valid URI', () => {
      onConstructionOf(TeamPipelineClient)
        .withArguments({
          apiUrl: 'spinach',
          team: data.randomTeam(),
          pipeline: data.randomPipeline(),
          httpClient: axios
        })
        .throwsError('Invalid parameter(s): ["apiUrl" must be a valid uri].')
    })

    it('throws an exception if the provided HTTP client is not an object',
      () => {
        onConstructionOf(TeamPipelineClient)
          .withArguments({
            httpClient: 35,
            team: data.randomTeam(),
            pipeline: data.randomPipeline(),
            apiUrl: faker.internet.url()
          })
          .throwsError(
            'Invalid parameter(s): ["httpClient" must be a Function].')
      })

    it('throws an exception if the team is not provided', () => {
      onConstructionOf(TeamPipelineClient)
        .withArguments({
          apiUrl: faker.internet.url(),
          httpClient: axios,
          pipeline: data.randomPipeline()
        })
        .throwsError('Invalid parameter(s): ["team" is required].')
    })

    it('throws an exception if the team is not an object', () => {
      onConstructionOf(TeamPipelineClient)
        .withArguments({
          team: 'wat',
          apiUrl: faker.internet.url(),
          httpClient: axios,
          pipeline: data.randomPipeline()
        })
        .throwsError('Invalid parameter(s): ["team" must be an object].')
    })

    it('throws an exception if the pipeline is not provided', () => {
      onConstructionOf(TeamPipelineClient)
        .withArguments({
          apiUrl: faker.internet.url(),
          httpClient: axios,
          team: data.randomTeam()
        })
        .throwsError('Invalid parameter(s): ["pipeline" is required].')
    })

    it('throws an exception if the pipeline is not an object', () => {
      onConstructionOf(TeamPipelineClient)
        .withArguments({
          pipeline: 'wat',
          apiUrl: faker.internet.url(),
          httpClient: axios,
          team: data.randomTeam()
        })
        .throwsError('Invalid parameter(s): ["pipeline" must be an object].')
    })
  })

  describe('pause', () => {
    it('pauses the pipeline',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name

        mock.onPut(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}/pause`)
          .reply(200)

        await client.pause()
        expect(mock.history.put).to.have.length(1)

        const call = mock.history.put[0]
        expect(call.url)
          .to.eql(`${apiUrl}/teams/${teamName}/pipelines/${pipelineName}/pause`)
        expect(call.headers)
          .to.include(bearerAuthHeader(bearerToken))
      })

    it('throws the underlying http client exception on failure',
      async () => {
        const { client, mock, apiUrl, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name

        mock.onPut(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}/pause`)
          .networkError()

        try {
          await client.pause()
        } catch (e) {
          expect(e).to.be.instanceOf(Error)
          expect(e.message).to.eql('Network Error')
        }
      })
  })

  describe('unpause', () => {
    it('unpauses the pipeline',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name

        mock.onPut(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}/unpause`)
          .reply(200)

        await client.unpause()
        expect(mock.history.put).to.have.length(1)

        const call = mock.history.put[0]
        expect(call.url)
          .to.eql(
            `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}/unpause`)
        expect(call.headers)
          .to.include(bearerAuthHeader(bearerToken))
      })

    it('throws the underlying http client exception on failure',
      async () => {
        const { client, mock, apiUrl, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name

        mock.onPut(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}/unpause`)
          .networkError()

        try {
          await client.unpause()
        } catch (e) {
          expect(e).to.be.instanceOf(Error)
          expect(e.message).to.eql('Network Error')
        }
      })
  })

  describe('delete', () => {
    it('deletes the pipeline',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name

        mock.onDelete(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(204)

        await client.delete()
        expect(mock.history.delete).to.have.length(1)

        const call = mock.history.delete[0]
        expect(call.url)
          .to.eql(`${apiUrl}/teams/${teamName}/pipelines/${pipelineName}`)
        expect(call.headers)
          .to.include(bearerAuthHeader(bearerToken))
      })

    it('throws the underlying http client exception on failure',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name

        mock.onDelete(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .networkError()

        try {
          await client.delete()
        } catch (e) {
          expect(e).to.be.instanceOf(Error)
          expect(e.message).to.eql('Network Error')
        }
      })
  })

  describe('listJobs', () => {
    it('gets all jobs for team pipeline',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name
        const jobData = data.randomJob({ teamName, pipelineName })

        const jobFromApi = build.api.job(jobData)
        const jobsFromApi = [jobFromApi]

        const convertedJob = build.client.job(jobData)
        const expectedJobs = [convertedJob]

        mock.onGet(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}/jobs`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(200, jobsFromApi)

        const actualJobs = await client.listJobs()

        expect(actualJobs).to.eql(expectedJobs)
      })
  })

  describe('getJob', () => {
    it('throws an exception if the job name is not provided',
      async () => {
        const { client } = buildValidTeamPipelineClient()
        await forInstance(client)
          .onCallOf('getJob')
          .withNoArguments()
          .throwsError('Invalid parameter(s): ["jobName" is required].')
      })

    it('throws an exception if the job name is not a string',
      async () => {
        const { client } = buildValidTeamPipelineClient()
        await forInstance(client)
          .onCallOf('getJob')
          .withArguments(12345)
          .throwsError(
            'Invalid parameter(s): ["jobName" must be a string].')
      })

    it('gets the job with the specified name',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name

        const jobName = data.randomJobName()
        const jobData = data.randomJob({
          teamName,
          pipelineName,
          name: jobName
        })

        const jobFromApi = build.api.job(jobData)

        const expectedJob = build.client.job(jobData)

        mock.onGet(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}` +
          `/jobs/${jobName}`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(200, jobFromApi)

        const actualJob = await client.getJob(jobName)

        expect(actualJob).to.eql(expectedJob)
      })
  })

  describe('forJob', () => {
    it('returns a client for the team pipeline job with the supplied name ' +
      'when the pipeline exists for that team',
    async () => {
      const {
        client, httpClient, mock, apiUrl, bearerToken, team, pipeline
      } = buildValidTeamPipelineClient()

      const teamName = team.name
      const pipelineName = pipeline.name

      const jobName = data.randomJobName()
      const jobData = data.randomJob({
        name: jobName,
        teamName,
        pipelineName
      })

      const jobFromApi = build.api.job(jobData)
      const expectedJob = build.client.job(jobData)

      mock.onGet(
        `${apiUrl}/teams/${team.name}/pipelines/${pipeline.name}` +
        `/jobs/${jobName}`,
        {
          headers: {
            ...bearerAuthHeader(bearerToken)
          }
        })
        .reply(200, jobFromApi)

      const teamPipelineJobClient = await client.forJob(jobName)

      expect(teamPipelineJobClient.apiUrl).to.equal(apiUrl)
      expect(teamPipelineJobClient.httpClient).to.equal(httpClient)
      expect(teamPipelineJobClient.team).to.eql(team)
      expect(teamPipelineJobClient.pipeline).to.eql(pipeline)
      expect(teamPipelineJobClient.job).to.eql(expectedJob)
    })

    it('throws an exception if no pipeline exists for the supplied name',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const jobName = data.randomJobName()

        mock.onGet(
          `${apiUrl}/teams/${team.name}/pipelines/${pipeline.name}` +
          `/jobs/${jobName}`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(404)

        try {
          await client.forJob(jobName)
          expect.fail('Expected exception but none was thrown.')
        } catch (e) {
          expect(e).to.be.an.instanceof(Error)
          expect(e.message).to.eql(`No job with name: ${jobName}`)
        }
      })
  })

  describe('listResources', () => {
    it('gets all resources for team pipeline',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name
        const resourceData = data.randomResource({ teamName, pipelineName })

        const resourceFromApi = build.api.resource(resourceData)
        const resourcesFromApi = [resourceFromApi]

        const convertedResource = build.client.resource(resourceData)
        const expectedResources = [convertedResource]

        mock.onGet(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}/resources`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(200, resourcesFromApi)

        const actualResources = await client.listResources()

        expect(actualResources).to.eql(expectedResources)
      })
  })

  describe('getResource', () => {
    it('throws an exception if the resource name is not provided',
      async () => {
        const { client } = buildValidTeamPipelineClient()
        await forInstance(client)
          .onCallOf('getResource')
          .withNoArguments()
          .throwsError('Invalid parameter(s): ["resourceName" is required].')
      })

    it('throws an exception if the resource name is not a string',
      async () => {
        const { client } = buildValidTeamPipelineClient()
        await forInstance(client)
          .onCallOf('getResource')
          .withArguments(12345)
          .throwsError(
            'Invalid parameter(s): ["resourceName" must be a string].')
      })

    it('gets the resource with the specified name',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name

        const resourceName = data.randomResourceName()
        const resourceData = data.randomResource({
          teamName,
          pipelineName,
          name: resourceName
        })

        const resourceFromApi = build.api.resource(resourceData)

        const expectedResource = build.client.resource(resourceData)

        mock.onGet(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}` +
          `/resources/${resourceName}`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(200, resourceFromApi)

        const actualResource = await client.getResource(resourceName)

        expect(actualResource).to.eql(expectedResource)
      })
  })

  describe('forResource', () => {
    it('returns a client for the team pipeline resource with the supplied ' +
      'name when the pipeline exists for that team',
    async () => {
      const {
        client, httpClient, mock, apiUrl, bearerToken, team, pipeline
      } = buildValidTeamPipelineClient()

      const teamName = team.name
      const pipelineName = pipeline.name

      const resourceName = data.randomResourceName()
      const resourceData = data.randomResource({
        name: resourceName,
        teamName,
        pipelineName
      })

      const resourceFromApi = build.api.resource(resourceData)
      const expectedResource = build.client.resource(resourceData)

      mock.onGet(
        `${apiUrl}/teams/${team.name}/pipelines/${pipeline.name}` +
          `/resources/${resourceName}`,
        {
          headers: {
            ...bearerAuthHeader(bearerToken)
          }
        })
        .reply(200, resourceFromApi)

      const teamPipelineResourceClient = await client.forResource(resourceName)

      expect(teamPipelineResourceClient.apiUrl).to.equal(apiUrl)
      expect(teamPipelineResourceClient.httpClient).to.equal(httpClient)
      expect(teamPipelineResourceClient.team).to.eql(team)
      expect(teamPipelineResourceClient.pipeline).to.eql(pipeline)
      expect(teamPipelineResourceClient.resource).to.eql(expectedResource)
    })

    it('throws an exception if no resource exists for the supplied name',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const resourceName = data.randomResourceName()

        mock.onGet(
          `${apiUrl}/teams/${team.name}/pipelines/${pipeline.name}` +
          `/resources/${resourceName}`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(404)

        try {
          await client.forResource(resourceName)
          expect.fail('Expected exception but none was thrown.')
        } catch (e) {
          expect(e).to.be.an.instanceof(Error)
          expect(e.message).to.eql(`No resource with name: ${resourceName}`)
        }
      })
  })

  describe('listResourceTypes', () => {
    it('gets all resource types for team pipeline',
      async () => {
        const { client, mock, apiUrl, bearerToken, team, pipeline } =
          buildValidTeamPipelineClient()

        const teamName = team.name
        const pipelineName = pipeline.name
        const resourceTypeData = data.randomResourceType({ teamName, pipelineName })

        const resourceTypeFromApi = build.api.resourceType(resourceTypeData)
        const resourceTypesFromApi = [resourceTypeFromApi]

        const convertedResourceType = build.client.resourceType(resourceTypeData)
        const expectedResourceTypes = [convertedResourceType]

        mock.onGet(
          `${apiUrl}/teams/${teamName}/pipelines/${pipelineName}/resource-types`,
          {
            headers: {
              ...bearerAuthHeader(bearerToken)
            }
          })
          .reply(200, resourceTypesFromApi)

        const actualResourceTypes = await client.listResourceTypes()

        expect(actualResourceTypes).to.eql(expectedResourceTypes)
      })
  })
})
