# Environment & Isolation — Kubernetes / Cloud

## Gitignore
```
.terraform/
*.tfstate
*.tfstate.backup
kubeconfig
.env
.claude/
```

## Toolchain
- `kubectl` — Kubernetes CLI
- `helm` — Kubernetes package manager
- `terraform` / `tofu` — Infrastructure as Code
- Cloud CLI: `aws` / `gcloud` / `az`
- `k9s` — terminal UI for cluster management

## Required Environment Variables / Secrets
```
AWS_PROFILE=                          # or GOOGLE_APPLICATION_CREDENTIALS / ARM_SUBSCRIPTION_ID
TF_VAR_*=                             # Terraform input variables
KUBECONFIG=                           # path to kubeconfig; never commit this file
```

## Worktree Isolation
Each infrastructure change lives in an isolated git worktree:
```bash
git worktree add ../infra-feature feat/infra-feature
```
