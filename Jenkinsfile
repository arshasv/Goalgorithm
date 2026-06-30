pipeline {

    agent any

    environment {

        APP_NAME="goalgorithm"

        IMAGE_NAME="192.168.21.116:8081/goalgorithm"

        TAG="${BUILD_NUMBER}"

        NEXUS_CREDENTIALS="nexus-creds"

        OKD_PROJECT="goalgorithm"

        OKD_TOKEN=credentials('okd-token')

        OKD_SERVER="https://api.lab.okd.local:6443"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {

                sh """
                docker build -t ${IMAGE_NAME}:${TAG} .
                """
            }
        }

        stage('Login Nexus') {

            steps {

                withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDENTIALS}",
                        usernameVariable: 'USER',
                        passwordVariable: 'PASS')]) {

                    sh """

                    docker login 192.168.21.116:8081 \
                    -u $USER \
                    -p $PASS

                    """
                }

            }
        }

        stage('Push Image') {

            steps {

                sh """

                docker push ${IMAGE_NAME}:${TAG}

                docker tag ${IMAGE_NAME}:${TAG} ${IMAGE_NAME}:latest

                docker push ${IMAGE_NAME}:latest

                """

            }

        }

        stage('Deploy OKD') {

            steps {

                sh """

                oc login ${OKD_SERVER} \
                --token=${OKD_TOKEN} \
                --insecure-skip-tls-verify=true

                oc project ${OKD_PROJECT}

                oc set image deployment/goalgorithm \
                goalgorithm=${IMAGE_NAME}:${TAG}

                oc rollout restart deployment/goalgorithm

                """

            }

        }

        stage('Verify Rollout') {

            steps {

                sh """

                oc rollout status deployment/goalgorithm

                oc get pods

                """

            }

        }

    }

}