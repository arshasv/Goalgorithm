pipeline {

    agent any

    options {
        timestamps()
    }

    environment {

        // Disable BuildKit (temporary fix for BuildKit issues)
        DOCKER_BUILDKIT = "0"

        // OKD Configuration
        OKD_PROJECT = "goalgorithm"
        OKD_API = "https://api.crc.testing:6443"
        REGISTRY_URL = "default-route-openshift-image-registry.apps-crc.testing"

        // Images
        FRONTEND_IMAGE = "frontend"
        BACKEND_IMAGE = "backend"

        TAG = "${BUILD_NUMBER}"

        // Jenkins Credential
        OKD_TOKEN_CREDENTIALS_ID = "okd-token"
    }

    stages {

        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Debug Environment') {
            steps {
                sh '''
                echo "========== SYSTEM =========="
                whoami
                id
                pwd

                echo "========== PATH =========="
                echo $PATH

                echo "========== DOCKER =========="
                which docker
                docker version
                docker info

                echo "========== BUILDX =========="
                docker buildx ls || true

                echo "========== OC =========="
                which oc || true
                oc version --client || true
                '''
            }
        }

        stage('Clean Docker Cache') {
            steps {
                sh '''
                docker builder prune -af || true
                docker image prune -af || true
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {

                    sh '''
                    export DOCKER_BUILDKIT=0

                    docker build --pull \
                    -t $REGISTRY_URL/$OKD_PROJECT/$BACKEND_IMAGE:$TAG .

                    docker tag \
                    $REGISTRY_URL/$OKD_PROJECT/$BACKEND_IMAGE:$TAG \
                    $REGISTRY_URL/$OKD_PROJECT/$BACKEND_IMAGE:latest
                    '''
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {

                    sh '''
                    export DOCKER_BUILDKIT=0

                    docker build --pull \
                    -t $REGISTRY_URL/$OKD_PROJECT/$FRONTEND_IMAGE:$TAG .

                    docker tag \
                    $REGISTRY_URL/$OKD_PROJECT/$FRONTEND_IMAGE:$TAG \
                    $REGISTRY_URL/$OKD_PROJECT/$FRONTEND_IMAGE:latest
                    '''
                }
            }
        }

        stage('Login to OKD Registry') {

            steps {

                withCredentials([
                    string(
                        credentialsId: "${OKD_TOKEN_CREDENTIALS_ID}",
                        variable: 'OKD_TOKEN'
                    )
                ]) {

                    sh '''
                    echo "$OKD_TOKEN" | docker login \
                    $REGISTRY_URL \
                    -u developer \
                    --password-stdin
                    '''
                }
            }
        }

        stage('Push Backend Image') {

            steps {

                sh '''
                docker push \
                $REGISTRY_URL/$OKD_PROJECT/$BACKEND_IMAGE:$TAG

                docker push \
                $REGISTRY_URL/$OKD_PROJECT/$BACKEND_IMAGE:latest
                '''
            }
        }

        stage('Push Frontend Image') {

            steps {

                sh '''
                docker push \
                $REGISTRY_URL/$OKD_PROJECT/$FRONTEND_IMAGE:$TAG

                docker push \
                $REGISTRY_URL/$OKD_PROJECT/$FRONTEND_IMAGE:latest
                '''
            }
        }

        stage('Deploy to OKD') {

            steps {

                withCredentials([
                    string(
                        credentialsId: "${OKD_TOKEN_CREDENTIALS_ID}",
                        variable: 'OKD_TOKEN'
                    )
                ]) {

                    sh '''
                    oc login \
                    --token=$OKD_TOKEN \
                    --server=$OKD_API \
                    --insecure-skip-tls-verify=true

                    oc project $OKD_PROJECT

                    echo "Updating Backend Deployment..."

                    oc set image deployment/backend \
                    backend=$REGISTRY_URL/$OKD_PROJECT/$BACKEND_IMAGE:$TAG

                    echo "Updating Frontend Deployment..."

                    oc set image deployment/frontend \
                    frontend=$REGISTRY_URL/$OKD_PROJECT/$FRONTEND_IMAGE:$TAG

                    oc rollout restart deployment/backend
                    oc rollout restart deployment/frontend

                    oc rollout status deployment/backend --timeout=300s
                    oc rollout status deployment/frontend --timeout=300s
                    '''
                }
            }
        }

        stage('Deployment Verification') {

            steps {

                sh '''
                oc project $OKD_PROJECT

                echo "================ PODS ================"
                oc get pods -o wide

                echo "================ DEPLOYMENTS ================"
                oc get deployment

                echo "================ SERVICES ================"
                oc get svc

                echo "================ ROUTES ================"
                oc get route

                echo "================ IMAGE STREAMS ================"
                oc get is

                echo "================ IMAGES ================"
                oc get istag
                '''
            }
        }
    }

    post {

        success {

            echo '''
====================================================
        GOALGORITHM DEPLOYMENT SUCCESSFUL
====================================================
'''
        }

        failure {

            echo '''
====================================================
        GOALGORITHM DEPLOYMENT FAILED
====================================================
'''
        }

        always {

            sh '''
            docker logout $REGISTRY_URL || true

            docker image prune -af || true
            docker builder prune -af || true
            '''
        }
    }
}