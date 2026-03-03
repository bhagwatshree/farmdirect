// =============================================================================
// FarmDirect CI Pipeline — Runs on every commit (build + test)
// =============================================================================
pipeline {
    agent any

    environment {
        PATH = "D:\\Node;${env.PATH}"
    }

    triggers {
        pollSCM('H/2 * * * *')  // Poll GitHub every 2 minutes for new commits
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHORT_COMMIT = bat(script: '@git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_COMMIT_MSG = bat(script: '@git log -1 --pretty=%%s', returnStdout: true).trim()
                    echo "Building: ${env.GIT_SHORT_COMMIT} — ${env.GIT_COMMIT_MSG}"
                }
            }
        }

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

        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            bat 'npm test -- --forceExit --detectOpenHandles'
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            bat 'set CI=true && npm run build'
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "CI PASSED for commit ${env.GIT_SHORT_COMMIT}"
        }
        failure {
            echo "CI FAILED for commit ${env.GIT_SHORT_COMMIT} — check logs above."
        }
    }
}
