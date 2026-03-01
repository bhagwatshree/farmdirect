module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
  aws_region   = var.aws_region
}

module "ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
  environment  = var.environment
}

module "secrets" {
  source                  = "./modules/secrets"
  project_name            = var.project_name
  environment             = var.environment
  jwt_secret              = var.jwt_secret
  openai_api_key          = var.openai_api_key
  razorpay_key_id         = var.razorpay_key_id
  razorpay_key_secret     = var.razorpay_key_secret
  razorpay_webhook_secret = var.razorpay_webhook_secret
  email_from              = var.email_from
  email_host              = var.email_host
  email_port              = var.email_port
  email_user              = var.email_user
  email_pass              = var.email_pass
  docdb_host              = module.documentdb.cluster_endpoint
  docdb_port              = tostring(module.documentdb.cluster_port)
  docdb_username          = var.docdb_master_username
  docdb_password          = var.docdb_master_password
  docdb_database          = "farmdirect"
}

module "ecs" {
  source             = "./modules/ecs"
  project_name       = var.project_name
  environment        = var.environment
  aws_region         = var.aws_region
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  container_port     = var.container_port
  cpu                = var.cpu
  memory             = var.memory
  desired_count      = var.desired_count
  ecr_repository_url = module.ecr.repository_url
  alb_target_group_arn    = module.alb.target_group_arn
  alb_security_group_id   = module.alb.alb_security_group_id
  secrets_arn               = module.secrets.secret_arn
  docdb_cluster_resource_id = module.documentdb.cluster_resource_id
  docdb_username            = var.docdb_master_username
}

module "documentdb" {
  source                = "./modules/documentdb"
  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_security_group_id = module.ecs.ecs_security_group_id
  master_username       = var.docdb_master_username
  master_password       = var.docdb_master_password
  instance_class        = var.docdb_instance_class
}

module "alb" {
  source             = "./modules/alb"
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  container_port     = var.container_port
}
