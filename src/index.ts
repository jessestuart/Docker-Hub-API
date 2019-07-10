import _ from 'lodash'
import fp from 'lodash/fp'
import { DateTime } from 'luxon'

import API from './api'
import RepositoryDetails from './types/RepositoryDetails'

const api = new API()

const NUM_REPOS_TO_ANALYZE = 20

const processRepo = ({ namespace, name }) => api.repository(namespace, name)

interface QueryOptions {
  username: string
}

export const queryTopRepos = async ({ username }: QueryOptions) => {
  const repos = await api.repositories(username)
  const repoDetails: RepositoryDetails[] = await Promise.all(
    repos.map(processRepo),
  )
  return _.flow(
    fp.orderBy('pull_count', 'desc'),
    fp.take(NUM_REPOS_TO_ANALYZE),
    fp.map(fields => {
      const dateTimeLastUpdated: DateTime = DateTime.fromISO(
        _.get(fields, 'last_updated'),
      )
      return {
        ..._.pick(fields, ['description', 'name', 'pull_count', 'star_count']),
        last_updated: dateTimeLastUpdated.toISODate(),
      }
    }),
  )(repoDetails)
}

const queryTotalPulls = async ({ username }: QueryOptions) => {
  const repos = await api.repositories(username)
  const repoDetails: RepositoryDetails[] = await Promise.all(
    repos.map(processRepo),
  )
  return _.sumBy(repoDetails, 'pull_count')
}

const USERNAME = 'jessestuart'
const topReposQuery = queryTopRepos({ username: USERNAME })
const totalPullsQuery = queryTotalPulls({ username: USERNAME })

Promise.all([topReposQuery, totalPullsQuery])
  .then(console.log)
  .catch(console.error)
