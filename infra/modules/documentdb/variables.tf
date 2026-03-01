variable "project_name" {}
variable "environment" {}
variable "vpc_id" {}
variable "private_subnet_ids" { type = list(string) }
variable "ecs_security_group_id" {}
variable "master_username" {}
variable "master_password" { sensitive = true }
variable "instance_class" { default = "db.t3.medium" }
