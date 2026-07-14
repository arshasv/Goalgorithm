pipeline {
    agent any

    environment {
        OKD_API = "https://api.crc.testing:6443"
        PROJECT = "goal"

        REGISTRY = "default-route-openshift-image-registry.apps-crc.testing"

        IMAGE_NAME = "web"
        IMAGE_TAG = "${BUILD_NUMBER}"

        VAULT_ADDR = "http://localhost:8200"
        SECRET_PATH = "secret/data/frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment Check') {
            steps {
                sh '''
                set +e

                echo "========== SYSTEM =========="
                hostname
                whoami

                echo
                echo "========== TOOLS =========="
                oc version --client
                docker --version
                jq --version
                curl --version

                echo
                echo "========== OKD =========="
                getent hosts api.crc.testing || true

                echo
                echo "========== VAULT =========="
                curl -s ${VAULT_ADDR}/v1/sys/health || true
                '''
            }
        }

        stage('Login to OKD') {
            steps {
                withCredentials([
                    string(credentialsId: 'okd-token', variable: 'TOKEN')
                ]) {
                    sh '''
                    set -e

                    oc login ${OKD_API} \
                        --token=$TOKEN \
                        --insecure-skip-tls-verify=true

                    oc project ${PROJECT}

                    oc whoami
                    '''
                }
            }
        }

        stage('Login to Vault') {
            steps {
                withCredentials([
                    string(credentialsId: 'vault-role-id', variable: 'ROLE_ID'),
                    string(credentialsId: 'vault-secret-id', variable: 'SECRET_ID')
                ]) {

                    sh '''
                    set -e

                    echo "Logging into Vault..."

                    curl -s \
                        --request POST \
                        --data "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" \
                        ${VAULT_ADDR}/v1/auth/approle/login \
                        > login.json

                    echo "===== LOGIN RESPONSE ====="
                    cat login.json

                    TOKEN=$(jq -r '.auth.client_token // empty' login.json)

                    if [ -z "$TOKEN" ]; then
                        echo "Vault authentication failed."
                        exit 1
                    fi

                    echo "$TOKEN" > vault.token
                    '''
                }
            }
        }

        stage('Read Secret From Vault') {
            steps {

                sh '''
                set -e

                TOKEN=$(cat vault.token)

                curl -s \
                    -H "X-Vault-Token: $TOKEN" \
                    ${VAULT_ADDR}/v1/${SECRET_PATH} \
                    > frontend.json

                echo "===== SECRET RESPONSE ====="
                cat frontend.json

                jq . frontend.json

                if jq -e '.errors' frontend.json >/dev/null; then
                    echo "Vault returned an error."
                    exit 1
                fi

                if ! jq -e '.data.data' frontend.json >/dev/null; then
                    echo "Secret not found."
                    exit 1
                fi
                '''
            }
        }

        stage('Generate Environment File') {

            steps {

                sh '''
                set -e

                jq -r '.data.data | to_entries[] | "\\(.key)=\\(.value)"' frontend.json > frontend.env

                echo "===== GENERATED ENV ====="
                cat frontend.env
                '''
            }
        }

        stage('Create OKD Secret') {

            steps {

                sh '''
                set -e

                oc delete secret frontend-secret --ignore-not-found=true

                oc create secret generic frontend-secret \
                    --from-env-file=frontend.env

                oc get secret frontend-secret
                '''
            }
        }

        stage('Build Docker Image') {

            steps {

                sh '''
                set -e

                docker build \
                    -t ${REGISTRY}/${PROJECT}/${IMAGE_NAME}:${IMAGE_TAG} .

                docker images | grep ${IMAGE_NAME}
                '''
            }
        }

        stage('Login to Internal Registry') {

            steps {

                sh '''
                set -e

                docker login \
                    -u kubeadmin \
                    -p $(oc whoami -t) \
                    ${REGISTRY}
                '''
            }
        }

        stage('Push Image') {

            steps {

                sh '''
                set -e

                docker push \
                    ${REGISTRY}/${PROJECT}/${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Update Deployment') {

            steps {

                sh '''
                set -e

                oc set image deployment/web \
                    web=${REGISTRY}/${PROJECT}/${IMAGE_NAME}:${IMAGE_TAG}

                oc rollout restart deployment/web

                oc rollout status deployment/web
                '''
            }
        }

    }

    post {

        success {

            echo "Deployment completed successfully."

        }

        failure {

            echo "Pipeline failed."

            sh '''
            echo
            echo "===== DEBUG FILES ====="

            ls -la

            [ -f login.json ] && cat login.json

            [ -f frontend.json ] && cat frontend.json

            [ -f frontend.env ] && cat frontend.env
            '''
        }

        always {

            sh '''
            rm -f vault.token
            rm -f login.json
            rm -f frontend.json
            rm -f frontend.env
            '''
        }

    }
}