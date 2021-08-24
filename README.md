# databricks-repo-sync-action
Repo created to store the action in charge to sync Github Repos with Databricks

## Inputs

## `account`

**Required** 

Databricks account. E.g.: `my-account` in the my-account.cloud.databricks.com domain.

## `access-token`

**Required** 

Databricks access token to be used as Authentication. It is **highly** recommended to use Github Actions secrets.

## `branch-tag`

**Required** 

Branch or tag to be used on sync. You can use the default GITHUB_REF parameter on many actions for this and the action will parse it automatically.

## `repo-id`

**Optional** 

Databricks repo internal ID. This is optional as long as you specify a **repo-path** E.g: 123456789012345

## `repo-path`

**Optional** 

Databricks repo path. This is optional as long as you specify a **repo-id** E.g: /Repos/production/my-repo

## Example usage

```
on:
# Trigger the workflow on push to main branch or tags with "v1." prefix
  push:
    branches:
      - main
  tags:
      - v1.*
jobs:
  sync:
    runs-on: ubuntu-latest
    name: Job to sync Databricks repo when releasing
    steps:
      - name: Sync Repo
        uses: neofinancial/databricks-repo-sync-action@v1.0.0
        with:
          account: 'my-databricks-account'
          access-token: ${{ secrets.DATABRICKS_TOKEN }}
          repo-path: '/Repos/production/my-repo'
          branch-tag: ${{ github.ref }}
```