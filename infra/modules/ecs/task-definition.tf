resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}-${var.environment}"
  retention_in_days = 30
  tags              = { Name = "${var.project_name}-logs" }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "${var.project_name}-app"
    image = "${var.ecr_repository_url}:latest"

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = tostring(var.container_port) },
      { name = "AWS_REGION", value = var.aws_region },
    ]

    secrets = [
      # App secrets
      { name = "JWT_SECRET", valueFrom = "${var.secrets_arn}:JWT_SECRET::" },
      { name = "OPENAI_API_KEY", valueFrom = "${var.secrets_arn}:OPENAI_API_KEY::" },
      { name = "RAZORPAY_KEY_ID", valueFrom = "${var.secrets_arn}:RAZORPAY_KEY_ID::" },
      { name = "RAZORPAY_KEY_SECRET", valueFrom = "${var.secrets_arn}:RAZORPAY_KEY_SECRET::" },
      { name = "RAZORPAY_WEBHOOK_SECRET", valueFrom = "${var.secrets_arn}:RAZORPAY_WEBHOOK_SECRET::" },
      # Email credentials
      { name = "EMAIL_FROM", valueFrom = "${var.secrets_arn}:EMAIL_FROM::" },
      { name = "EMAIL_HOST", valueFrom = "${var.secrets_arn}:EMAIL_HOST::" },
      { name = "EMAIL_PORT", valueFrom = "${var.secrets_arn}:EMAIL_PORT::" },
      { name = "EMAIL_USER", valueFrom = "${var.secrets_arn}:EMAIL_USER::" },
      { name = "EMAIL_PASS", valueFrom = "${var.secrets_arn}:EMAIL_PASS::" },
      # DocumentDB credentials
      { name = "DOCDB_HOST", valueFrom = "${var.secrets_arn}:DOCDB_HOST::" },
      { name = "DOCDB_PORT", valueFrom = "${var.secrets_arn}:DOCDB_PORT::" },
      { name = "DOCDB_USERNAME", valueFrom = "${var.secrets_arn}:DOCDB_USERNAME::" },
      { name = "DOCDB_PASSWORD", valueFrom = "${var.secrets_arn}:DOCDB_PASSWORD::" },
      { name = "DOCDB_DATABASE", valueFrom = "${var.secrets_arn}:DOCDB_DATABASE::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:${var.container_port}/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })\""]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}
