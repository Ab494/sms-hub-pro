output "app_name" {
  value = local.full_name
}

output "backend_url" {
  value = "http://localhost:${var.backend_port}"
}

output "frontend_url" {
  value = "http://localhost:${var.frontend_port}"
}

output "environment" {
  value = var.environment
}

output "tags" {
  value = local.common_tags
}
