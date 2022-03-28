# Preparation:
Set the git configuration to your git email and name in der Dockerfile (line 15,16).

# Build:
`DOCKER_BUILDKIT=1 docker image build --ssh default -t mockoon-bin-version-bump .`

If you want to use another ssh key than default you have to pass its value.

# Run:
`docker run --volume $SSH_AUTH_SOCK:/ssh-agent --env SSH_AUTH_SOCK=/ssh-agent mockoon-bin-version-bump "<VERSION>"`
