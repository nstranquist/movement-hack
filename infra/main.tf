terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "env" {
  default = "dev"
}

# SSM Parameter Store — free standard tier
# Secrets are created here as placeholders; set actual values via AWS console or CLI
# aws ssm put-parameter --name /bountymove/dev/ANTHROPIC_API_KEY --value "sk-..." --type SecureString --overwrite

resource "aws_ssm_parameter" "anthropic_api_key" {
  name  = "/bountymove/${var.env}/ANTHROPIC_API_KEY"
  type  = "SecureString"
  value = "PLACEHOLDER"

  lifecycle {
    ignore_changes = [value] # Don't overwrite values set outside terraform
  }

  tags = {
    project = "bountymove"
    env     = var.env
  }
}

resource "aws_ssm_parameter" "agent_private_key" {
  name  = "/bountymove/${var.env}/AGENT_PRIVATE_KEY"
  type  = "SecureString"
  value = "PLACEHOLDER"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    project = "bountymove"
    env     = var.env
  }
}

resource "aws_ssm_parameter" "module_address" {
  name  = "/bountymove/${var.env}/MODULE_ADDRESS"
  type  = "String"
  value = "PLACEHOLDER"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    project = "bountymove"
    env     = var.env
  }
}
