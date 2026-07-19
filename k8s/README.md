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
- Local Ollama on your machine: use `LLM_BASE_URL=http://host.minikube.internal:11434/v1` on minikube, so the pod can reach a service running on your host. Inside a pod, `localhost` means the pod itself, not your machine.

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

## Updating

- Code change: rebuild the image, reload it into the cluster, then `kubectl -n botman rollout restart deploy/<name>`.
- `.env` change: re-run the Secret command in step 3, then rollout restart.
