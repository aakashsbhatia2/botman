# Kubernetes (local)

Runs the two core services, mcp-tools and bot, on a local minikube or kind cluster using Kustomize. The Secret is generated from your existing root `.env`, so config still lives in one place.

## Prerequisites

- A running local cluster: `minikube start` (or `kind create cluster`)
- Your filled-in root `.env` (the same file Docker Compose uses)
- kubectl 1.23 or newer (older versions do not skip comment lines in env files)

## Adjust .env for the cluster first

The Secret is built from `.env` in step 3, so fix these values before you start.

`LLM_BASE_URL` must point at an endpoint reachable from inside the cluster:

- Anthropic: `LLM_BASE_URL=https://api.anthropic.com/v1/` works as-is.
- Local Ollama on your machine: `LLM_BASE_URL=http://host.docker.internal:11434/v1`. The bot Deployment maps `host.docker.internal` to your host with a `hostAlias`, so the pod can reach Ollama running on your machine. Set Ollama to listen on all interfaces (`OLLAMA_HOST=0.0.0.0`), since the pod reaches it over your host's gateway interface, not loopback.

If Docker runs via Docker Desktop, the cluster lives inside the Docker Desktop VM, so `host.minikube.internal` resolves to that VM, not your host. `host.docker.internal` (the hostAlias IP `192.168.65.2`) is what actually reaches your host. If a Docker Desktop update ever changes that IP, re-derive it with `minikube ssh -- 'getent hosts host.docker.internal'` and update the `hostAliases` IP in `k8s/base/bot-deployment.yaml`.

`MCP_SERVER_URL` does not need editing. It is set on the bot Deployment to the in-cluster Service address and overrides whatever is in `.env`.

## 1. Build the images and load them into the cluster

The cluster cannot see images sitting in your local Docker by default. You build them, then load them into the cluster's own image store.

minikube:

```
docker build -t botman-mcp-tools:local ./mcp-tools
docker build -t botman-bot:local ./bot
minikube image load botman-mcp-tools:local
minikube image load botman-bot:local
```

kind:

```
docker build -t botman-mcp-tools:local ./mcp-tools
docker build -t botman-bot:local ./bot
kind load docker-image botman-mcp-tools:local botman-bot:local
```

## 2. Apply the manifests

```
kubectl apply -k k8s/base
```

This creates the namespace, the Service, and both Deployments. The pods will not start cleanly yet because the Secret they reference does not exist. That is expected until the next step.

## 3. Create the Secret from your .env

```
kubectl -n botman create secret generic botman-env --from-env-file=.env \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n botman rollout restart deploy/bot deploy/mcp-tools
```

The first command turns every KEY=VALUE line in `.env` into a key in the `botman-env` Secret. The `--dry-run | apply` form makes it idempotent, so you can re-run it whenever `.env` changes. The rollout restart makes the pods pick up the new Secret.

## 4. Check it

```
kubectl -n botman get pods
kubectl -n botman logs deploy/mcp-tools
kubectl -n botman logs deploy/bot
```

Both pods should reach `Running`. mcp-tools should log that it is listening; the bot should log that it connected to Discord.

## Optional: route LLM calls through agentgateway

`agentgateway` is an opt-in add-on that proxies LLM calls, so the bot talks to one endpoint and the gateway routes to Ollama or Anthropic and meters cost. It has its own kustomization in `k8s/gateway` and is applied on top of the core, never part of it.

1. Build and load its image:

```
docker build -t botman-agentgateway:local ./agentgateway
minikube image load botman-agentgateway:local
```

2. Apply the add-on (the core in `k8s/base` must already be up):

```
kubectl apply -k k8s/gateway
```

3. Point the bot at the gateway. In `.env`:

```
LLM_BASE_URL=http://agentgateway.botman.svc.cluster.local:3000/v1
LLM_MODEL=ollama/<your-ollama-model>
```

The `ollama/` prefix routes to your host Ollama; use `anthropic/<model>` (for example `anthropic/claude-sonnet-4-6`) to route to Claude, which needs `ANTHROPIC_API_KEY` set in `.env`. Then re-run the Secret command in step 3 and `kubectl -n botman rollout restart deploy/bot`.

The gateway carries the `host.docker.internal` hostAlias and `OLLAMA_BASE_URL`, so it reaches host Ollama the same way the bot does. The bot now only talks to the gateway over cluster DNS.

To turn it off: `kubectl delete -k k8s/gateway`, then revert `LLM_BASE_URL` and `LLM_MODEL` in `.env` and re-push the Secret.

## Updating

- Code change: rebuild the image, reload it into the cluster, then `kubectl -n botman rollout restart deploy/<name>`.
- `.env` change: re-run the Secret command in step 3, then rollout restart.
