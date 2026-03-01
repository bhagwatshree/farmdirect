variable "project_name" {}
variable "environment" {}
variable "aws_region" {}
variable "vpc_id" {}
variable "private_subnet_ids" { type = list(string) }
variable "container_port" { type = number }
variable "cpu" { type = number }
variable "memory" { type = number }
variable "desired_count" { type = number }
variable "ecr_repository_url" {}
variable "alb_target_group_arn" {}
variable "alb_security_group_id" {}
variable "secrets_arn" {}
variable "docdb_cluster_resource_id" {}
variable "docdb_username" {}
