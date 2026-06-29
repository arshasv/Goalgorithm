pipeline {

    agent any

    environment {

        APP_NAME="goalgorithm"

        REGISTRY="http://192.168.21.116:8081"

        IMAGE="${REGISTRY}/${APP_NAME}"

        TAG="${BUILD_NUMBER}"

        NEXUS_CREDS="nexus-creds"

        OKD_PROJECT="goalgorithm"

        OKD_TOKEN=credentials('okd-token')

        OKD_API="https://api.lab.okd.local:6443"

    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh """
                docker build -t ${IMAGE}:${TAG} .
                """
            }
        }

        stage('Login Nexus') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId:'nexus-creds',
                        usernameVariable:'USERNAME',
                        passwordVariable:'PASSWORD'
                    )
                ]) {

                    sh """
                    docker login ${REGISTRY} \
                    -u $USERNAME \
                    -p $PASSWORD
                    """

                }

            }
        }

        stage('Push Image') {

            steps {

                sh """
                docker push ${IMAGE}:${TAG}
                docker tag ${IMAGE}:${TAG} ${IMAGE}:latest
                docker push ${IMAGE}:latest
                """

            }

        }

        stage('Login OKD') {

            steps {

                sh """
                oc login ${OKD_API} \
                --token=$OKD_TOKEN \
                --insecure-skip-tls-verify=true

                oc project ${OKD_PROJECT}
                """

            }

        }

        stage('Deploy') {

            steps {

                sh """
                oc set image deployment/goalgorithm \
                goalgorithm=${IMAGE}:${TAG}

                oc rollout restart deployment/goalgorithm
                """

            }

        }

        stage('Verify') {

            steps {

                sh """

                oc rollout status deployment/goalgorithm

                oc get pods

                oc get svc

                oc get routes

                """

            }

        }

    }

}