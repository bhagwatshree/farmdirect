variable "project_name" {}
variable "environment" {}
variable "jwt_secret" { sensitive = true }
variable "openai_api_key" { sensitive = true }
variable "razorpay_key_id" { sensitive = true }
variable "razorpay_key_secret" { sensitive = true }
variable "razorpay_webhook_secret" { sensitive = true }
variable "email_from" {}
variable "email_host" { default = "smtp.gmail.com" }
variable "email_port" { default = "587" }
variable "email_user" {}
variable "email_pass" { sensitive = true }
variable "docdb_host" {}
variable "docdb_port" {}
variable "docdb_username" {}
variable "docdb_password" { sensitive = true }
variable "docdb_database" { default = "farmdirect" }
