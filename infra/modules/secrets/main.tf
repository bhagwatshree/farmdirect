resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.project_name}/${var.environment}/app-secrets"
  tags = { Name = "${var.project_name}-secrets" }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    JWT_SECRET              = var.jwt_secret
    OPENAI_API_KEY          = var.openai_api_key
    RAZORPAY_KEY_ID         = var.razorpay_key_id
    RAZORPAY_KEY_SECRET     = var.razorpay_key_secret
    RAZORPAY_WEBHOOK_SECRET = var.razorpay_webhook_secret
    EMAIL_FROM              = var.email_from
    EMAIL_USER              = var.email_user
    EMAIL_PASS              = var.email_pass
    EMAIL_HOST              = "smtp.gmail.com"
    EMAIL_PORT              = "587"
    DOCDB_HOST              = var.docdb_host
    DOCDB_PORT              = var.docdb_port
    DOCDB_USERNAME          = var.docdb_username
    DOCDB_PASSWORD          = var.docdb_password
    DOCDB_DATABASE          = var.docdb_database
  })
}
