pipeline {
    agent any

    environment {
        AWS_REGION         = 'ap-south-1'
        ECR_REPOSITORY     = 'farmdirect-prod'
        ECS_CLUSTER        = 'farmdirect-prod'
        ECS_SERVICE        = 'farmdirect-prod-service'
        DOCKER_IMAGE_TAG   = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'unknown'}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 30, unit: 'MINUTES')
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
            description: 'Skip running tests (use with caution)'
        )
        booleanParam(
            name: 'FORCE_DEPLOY',
            defaultValue: false,
            description: 'Force deployment even if no code changes detected'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHORT_COMMIT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_COMMIT_MSG   = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    echo "Building commit: ${env.GIT_SHORT_COMMIT} - ${env.GIT_COMMIT_MSG}"
                }
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Lint & Test') {
            when {
                expression { return !params.SKIP_TESTS }
            }
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm test -- --forceExit --detectOpenHandles'
                        }
                    }
                    post {
                        always {
                            junit(testResults: 'backend/junit.xml', allowEmptyResults: true)
                        }
                    }
                }
                stage('Frontend Build Check') {
                    steps {
                        dir('frontend') {
                            sh 'CI=true npm run build'
                        }
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    def ecrRegistry = sh(
                        script: "aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} --query 'repositories[0].repositoryUri' --output text | sed 's|/.*||'",
                        returnStdout: true
                    ).trim()
                    env.ECR_REGISTRY = ecrRegistry

                    sh """
                        docker build \
                            -t ${env.ECR_REGISTRY}/${ECR_REPOSITORY}:${DOCKER_IMAGE_TAG} \
                            -t ${env.ECR_REGISTRY}/${ECR_REPOSITORY}:latest \
                            .
                    """
                }
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${env.ECR_REGISTRY}"
                    sh "docker push ${env.ECR_REGISTRY}/${ECR_REPOSITORY}:${DOCKER_IMAGE_TAG}"
                    sh "docker push ${env.ECR_REGISTRY}/${ECR_REPOSITORY}:latest"
                }
            }
        }

        stage('Deploy to ECS') {
            steps {
                script {
                    def cluster = (params.ENVIRONMENT == 'staging') ? 'farmdirect-staging' : ECS_CLUSTER
                    def service = (params.ENVIRONMENT == 'staging') ? 'farmdirect-staging-service' : ECS_SERVICE

                    echo "Deploying ${DOCKER_IMAGE_TAG} to ${params.ENVIRONMENT} (${cluster}/${service})"

                    sh """
                        aws ecs update-service \
                            --cluster ${cluster} \
                            --service ${service} \
                            --force-new-deployment \
                            --region ${AWS_REGION}
                    """
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    def cluster = (params.ENVIRONMENT == 'staging') ? 'farmdirect-staging' : ECS_CLUSTER
                    def service = (params.ENVIRONMENT == 'staging') ? 'farmdirect-staging-service' : ECS_SERVICE

                    echo "Waiting for ECS service to stabilize..."
                    sh """
                        aws ecs wait services-stable \
                            --cluster ${cluster} \
                            --services ${service} \
                            --region ${AWS_REGION}
                    """
                    echo "Deployment verified — service is stable."
                }
            }
        }
    }

    post {
        success {
            echo "Release ${DOCKER_IMAGE_TAG} deployed to ${params.ENVIRONMENT} successfully."
        }
        failure {
            echo "Release failed for commit ${env.GIT_SHORT_COMMIT}. Check logs above."
        }
        cleanup {
            sh "docker rmi ${env.ECR_REGISTRY}/${ECR_REPOSITORY}:${DOCKER_IMAGE_TAG} || true"
            sh "docker rmi ${env.ECR_REGISTRY}/${ECR_REPOSITORY}:latest || true"
            cleanWs()
        }
    }
}
