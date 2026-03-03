// =============================================================================
// FarmDirect CI Pipeline — Runs on every commit (build + test)
// =============================================================================
pipeline {
    agent any

    environment {
        PATH = "D:\\Node;${env.PATH}"
    }

    triggers {
        pollSCM('H/10 * * * *')  // Poll GitHub every 2 minutes for new commits
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 40, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                bat 'taskkill /F /IM node.exe 2>NUL || exit /b 0'
                checkout scm
                script {
                    env.GIT_SHORT_COMMIT = bat(script: '@git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_COMMIT_MSG = bat(script: '@git log -1 --pretty=%%s', returnStdout: true).trim()
                    echo "Building: ${env.GIT_SHORT_COMMIT} — ${env.GIT_COMMIT_MSG}"
                }
            }
        }

        stage('Install Backend Deps') {
            steps {
                dir('backend') {
                    bat 'D:\\Node\\npm.cmd install'
                }
            }
        }

        stage('Install Frontend Deps') {
            steps {
                dir('frontend') {
                    bat 'D:\\Node\\npm.cmd install'
                }
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    bat 'D:\\Node\\npm.cmd test -- --forceExit --detectOpenHandles'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    bat 'set CI=true && D:\\Node\\npm.cmd run build'
                }
            }
        }
    }

    post {
        always {
            bat 'taskkill /F /IM node.exe 2>NUL || exit /b 0'
        }
        success {
            echo "CI PASSED for commit ${env.GIT_SHORT_COMMIT}"
        }
        failure {
            echo "CI FAILED for commit ${env.GIT_SHORT_COMMIT} — check logs above."
        }
    }
}
