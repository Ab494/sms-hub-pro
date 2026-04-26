terraform {
  required_version = ">= 1.0"
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

module "smshubpro" {
  source = "../../modules/app"

  environment       = "development"
  app_name          = "smshubpro"
  backend_port      = 10000
  frontend_port     = 8082
  mongodb_uri       = var.mongodb_uri
  jwt_secret        = var.jwt_secret
  sms_api_key       = var.sms_api_key
  sms_sender        = "SMSHUB"
  sms_cost_per_unit = 0.46
  frontend_url      = "http://localhost:8082"
}

output "app_info" {
  value = {
    name         = module.smshubpro.app_name
    backend_url  = module.smshubpro.backend_url
    frontend_url = module.smshubpro.frontend_url
    environment  = module.smshubpro.environment
  }
}

variable "mongodb_uri" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "sms_api_key" {
  type      = string
  sensitive = true
}
