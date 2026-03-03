pipeline {
    agent any

    environment {
        AWS_REGION       = 'ap-south-1'
        AWS_ACCOUNT_ID   = '405114130882'
        ECR_REPOSITORY   = 'farmdirect-prod'
        ECS_CLUSTER      = 'farmdirect-prod'
        ECS_SERVICE      = 'farmdirect-prod-service'
        ECR_REGISTRY     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['prod', 'staging'],
            description: 'Target deployment environment'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip test stage (use with caution)'
        )
        booleanParam(
            name: 'PROVISION_INFRA',
            defaultValue: false,
            description: 'Run Terraform to provision/update AWS infrastructure (first-time or infra changes)'
        )
    }

    stages {

        // ── Checkout ────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHORT_COMMIT = bat(script: '@git rev-parse --short HEAD', returnStdout: true).trim()
                    env.DOCKER_IMAGE_TAG = "${BUILD_NUMBER}-${env.GIT_SHORT_COMMIT}"
                    echo "Building commit: ${env.GIT_SHORT_COMMIT} | Image tag: ${env.DOCKER_IMAGE_TAG}"
                }
            }
        }

        // ── Provision Infrastructure (Terraform) ────────────────────────
        stage('Provision Infrastructure') {
            when {
                expression { return params.PROVISION_INFRA }
            }
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    dir('infra') {
                        bat """
                            set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID%
                            set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY%
                            set AWS_DEFAULT_REGION=${AWS_REGION}
                            terraform init
                            terraform plan -out=tfplan
                        """
                        input message: 'Review the Terraform plan above. Approve to apply?', ok: 'Apply'
                        bat """
                            set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID%
                            set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY%
                            set AWS_DEFAULT_REGION=${AWS_REGION}
                            terraform apply -auto-approve tfplan
                        """
                    }
                }
            }
        }

        // ── Install Dependencies ────────────────────────────────────────
        stage('Install Dependencies') {
            parallel {
                stage('Backend Deps') {
                    steps {
                        dir('backend') {
                            bat 'npm ci'
                        }
                    }
                }
                stage('Frontend Deps') {
                    steps {
                        dir('frontend') {
                            bat 'npm ci'
                        }
                    }
                }
            }
        }

        // ── Test ────────────────────────────────────────────────────────
        stage('Test') {
            when {
                expression { return !params.SKIP_TESTS }
            }
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            bat 'npm test -- --forceExit --detectOpenHandles'
                        }
                    }
                }
                stage('Frontend Build Check') {
                    steps {
                        dir('frontend') {
                            bat 'set CI=true && npm run build'
                        }
                    }
                }
            }
        }

        // ── Docker Build ────────────────────────────────────────────────
        stage('Docker Build') {
            steps {
                bat """
                    docker build ^
                        -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:${env.DOCKER_IMAGE_TAG} ^
                        -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest ^
                        .
                """
            }
        }

        // ── Push to ECR ─────────────────────────────────────────────────
        stage('Push to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    bat """
                        set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID%
                        set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY%
                        set AWS_DEFAULT_REGION=${AWS_REGION}
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    """
                    bat "docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${env.DOCKER_IMAGE_TAG}"
                    bat "docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest"
                }
            }
        }

        // ── Deploy to ECS ───────────────────────────────────────────────
        stage('Deploy to ECS') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    script {
                        def cluster = (params.ENVIRONMENT == 'staging') ? 'farmdirect-staging' : ECS_CLUSTER
                        def service = (params.ENVIRONMENT == 'staging') ? 'farmdirect-staging-service' : ECS_SERVICE

                        echo "Deploying ${env.DOCKER_IMAGE_TAG} to ${params.ENVIRONMENT}"

                        bat """
                            set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID%
                            set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY%
                            set AWS_DEFAULT_REGION=${AWS_REGION}
                            aws ecs update-service --cluster ${cluster} --service ${service} --force-new-deployment --region ${AWS_REGION}
                        """
                    }
                }
            }
        }

        // ── Verify Deployment ───────────────────────────────────────────
        stage('Verify Deployment') {
            steps {
                withCredentials([
                    string(credentialsId: 'AWS_ACCESS_KEY_ID',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'AWS_SECRET_ACCESS_KEY', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    script {
                        def cluster = (params.ENVIRONMENT == 'staging') ? 'farmdirect-staging' : ECS_CLUSTER
                        def service = (params.ENVIRONMENT == 'staging') ? 'farmdirect-staging-service' : ECS_SERVICE

                        echo "Waiting for ECS service to stabilize..."
                        bat """
                            set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID%
                            set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY%
                            set AWS_DEFAULT_REGION=${AWS_REGION}
                            aws ecs wait services-stable --cluster ${cluster} --services ${service} --region ${AWS_REGION}
                        """
                        echo "Deployment verified — service is stable."
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Release ${env.DOCKER_IMAGE_TAG} deployed to ${params.ENVIRONMENT} successfully."
        }
        failure {
            echo "Release failed. Check stage logs above for details."
        }
        cleanup {
            bat "docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:${env.DOCKER_IMAGE_TAG} 2>nul || echo cleanup done"
            bat "docker rmi ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest 2>nul || echo cleanup done"
        }
    }
}
