terraform {
  required_version = ">= 1.0"
}

locals {
  full_name     = "${var.app_name}-${var.environment}"
  is_production = var.environment == "production"

  # Environment-specific settings
  log_level  = local.is_production ? "warn" : "debug"
  rate_limit = local.is_production ? 100 : 1000

  common_tags = {
    app         = var.app_name
    environment = var.environment
    managed_by  = "terraform"
    repo        = "sms-hub-pro"
  }
}

# ── Generate docker-compose for local development ──
resource "local_file" "docker_compose" {
  filename = "${path.module}/../../environments/${var.environment}/docker-compose.generated.yml"

  content = templatefile("${path.module}/docker-compose.tpl", {
    app_name          = var.app_name
    environment       = var.environment
    backend_port      = var.backend_port
    frontend_port     = var.frontend_port
    mongodb_uri       = var.mongodb_uri
    jwt_secret        = var.jwt_secret
    sms_api_key       = var.sms_api_key
    sms_sender        = var.sms_sender
    sms_cost_per_unit = var.sms_cost_per_unit
    frontend_url      = var.frontend_url
    log_level         = local.log_level
    rate_limit        = local.rate_limit
  })
}

# ── Generate .env file ─────────────────────────────
resource "local_file" "env_file" {
  filename = "${path.module}/../../environments/${var.environment}/.env.generated"

  content = sensitive(templatefile("${path.module}/env.tpl", {
    environment       = var.environment
    backend_port      = var.backend_port
    mongodb_uri       = var.mongodb_uri
    jwt_secret        = var.jwt_secret
    sms_api_key       = var.sms_api_key
    sms_sender        = var.sms_sender
    sms_cost_per_unit = var.sms_cost_per_unit
    frontend_url      = var.frontend_url
    log_level         = local.log_level
    rate_limit        = local.rate_limit
  }))
}
