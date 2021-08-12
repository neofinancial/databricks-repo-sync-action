/**
 * Parses github actions ref variable that follows the format: refs/<heads|tags>/<branch_name|tag_name>
 * @param  {[String]} githubRef
 * @return {[Array]} returns an array containing the branch and tag. One will always be null
 */
function parseBranchTag(githubRef) {
    var parsedGithubRef = githubRef.split('/');

    if (!githubRef.startsWith('refs/') || parsedGithubRef.length < 3) {
        throw new Error(`Failed to parse branch/tag from ${githubRef}`)
    }

    var pushType;
    var refName;

    if (parsedGithubRef.length == 3) {
        [_, pushType, refName] = parsedGithubRef
    } else {
        refName = parsedGithubRef.slice(2).join('/')
        pushType = parsedGithubRef[1]
    }

    if (pushType == "heads") {
        return [refName, null]
    }
    return [null, refName]
}

module.exports = {
    parseBranchTag: parseBranchTag
}