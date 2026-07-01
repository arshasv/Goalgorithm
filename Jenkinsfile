pipeline {

    environment {

        APP_NAME="goalgorithm"

        REGISTRY="192.168.21.116:8081"

        REPOSITORY="docker"

        IMAGE="${REGISTRY}/${REPOSITORY}/${APP_NAME}"

        BUILD_TAG="${BUILD_NUMBER}"

        GIT_SHA="${env.GIT_COMMIT}"

        PROJECT="goalgorithm"

        OC_API="https://api.okd.local:6443"

    }

    stages {

        stage('Checkout') {

            steps {
                git branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/arshasv/Goalgorithm.git'
            }

        }

        stage('Install Dependencies') {

            steps {

                sh '''
                npm install
                '''

            }

        }

        stage('Build') {

            steps {

                sh '''
                npm run build
                '''

            }

        }

        stage('Docker Build') {

            steps {

                sh """

                docker build \
                -t ${IMAGE}:${BUILD_NUMBER} \
                -t ${IMAGE}:latest \
                -t ${IMAGE}:${GIT_COMMIT.take(7)} .

                """

            }

        }

        stage('Push Image') {

            steps {

                withCredentials([usernamePassword(

                        credentialsId: 'nexus-creds',

                        usernameVariable: 'USER',

                        passwordVariable: 'PASS'

                )]) {

                    sh """

                    echo \$PASS | docker login ${REGISTRY} \
                    -u \$USER \
                    --password-stdin

                    docker push ${IMAGE}:${BUILD_NUMBER}

                    docker push ${IMAGE}:latest

                    docker push ${IMAGE}:${GIT_COMMIT.take(7)}

                    """

                }

            }

        }

        stage('Deploy OKD') {

            steps {

                withCredentials([string(credentialsId: 'okd-token',

                        variable: 'TOKEN')]) {

                    sh """

                    oc login ${OC_API} --token=\$TOKEN --insecure-skip-tls-verify=true

                    oc project ${PROJECT}

                    oc set image deployment/${APP_NAME} \
                    ${APP_NAME}=${IMAGE}:${BUILD_NUMBER}

                    oc rollout status deployment/${APP_NAME}

                    """

                }

            }

        }

        stage('Verification') {

            steps {

                sh '''

                oc get pods

                oc get deployment

                oc get svc

                oc get route

                oc rollout history deployment/goalgorithm

                '''

            }

        }

    }

    post {

        success {

            echo "Deployment Successful"

        }

        failure {

            echo "Deployment Failed"

        }

        always {

            sh 'docker logout ${REGISTRY} || true'

        }

    }

}