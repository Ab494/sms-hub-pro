variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "smshubpro"
}

variable "backend_port" {
  description = "Port the backend runs on"
  type        = number
  default     = 10000
}

variable "frontend_port" {
  description = "Port the frontend runs on locally"
  type        = number
  default     = 8082
}

variable "mongodb_uri" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "sms_api_key" {
  description = "BlessedTexts SMS API key"
  type        = string
  sensitive   = true
}

variable "sms_sender" {
  description = "SMS sender ID"
  type        = string
  default     = "FERRITE"
}

variable "sms_cost_per_unit" {
  description = "Cost per SMS unit in KES"
  type        = number
  default     = 0.46
}

variable "frontend_url" {
  description = "Frontend URL for CORS"
  type        = string
}

variable "node_version" {
  description = "Node.js version"
  type        = string
  default     = "18"
}
