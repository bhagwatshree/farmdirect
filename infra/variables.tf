variable "aws_region" {
  description = "AWS region to deploy into"
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  default     = "farmdirect"
}

variable "environment" {
  description = "Deployment environment (prod, staging, dev)"
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "container_port" {
  description = "Port the container listens on"
  default     = 5000
}

variable "desired_count" {
  description = "Number of ECS tasks to run"
  default     = 2
}

variable "cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)"
  default     = 512
}

variable "memory" {
  description = "Fargate task memory in MB"
  default     = 1024
}

variable "docdb_instance_class" {
  description = "DocumentDB instance class"
  default     = "db.t3.medium"
}

variable "docdb_master_username" {
  description = "DocumentDB master username"
  default     = "farmdirect_admin"
}

variable "docdb_master_password" {
  description = "DocumentDB master password"
  type        = string
  sensitive   = true
}

# --- Secrets ---

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "razorpay_key_id" {
  type      = string
  sensitive = true
}

variable "razorpay_key_secret" {
  type      = string
  sensitive = true
}

variable "razorpay_webhook_secret" {
  type      = string
  sensitive = true
}

variable "email_from" {
  type = string
}

variable "email_user" {
  type = string
}

variable "email_host" {
  description = "SMTP host for sending emails"
  type        = string
  default     = "smtp.gmail.com"
}

variable "email_port" {
  description = "SMTP port for sending emails"
  type        = string
  default     = "587"
}

variable "email_pass" {
  type      = string
  sensitive = true
}
