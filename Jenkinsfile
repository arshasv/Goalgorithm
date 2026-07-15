pipeline {
    agent any

    environment {
        OKD_API = "https://api.crc.testing:6443"
        PROJECT = "goal"

        REGISTRY = "default-route-openshift-image-registry.apps-crc.testing"

        IMAGE_NAME = "web"
        IMAGE_TAG = "${BUILD_NUMBER}"

        SECRET_PATH = "secret/data/frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
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
                    '''
                }
            }
        }

        stage('Verify Parameters') {
            steps {
                echo "VAULT_ADDR = ${params.VAULT_ADDR}"
                echo "ROLE ID Length = ${params.VAULT_ROLE_ID.length()}"
                echo "SECRET ID Length = ${params.VAULT_SECRET_ID.length()}"
            }
        }

        stage('Login to Vault') {
            steps {
                withEnv([
                    "VAULT_URL=${params.VAULT_ADDR}",
                    "ROLE_ID=${params.VAULT_ROLE_ID}",
                    "SECRET_ID=${params.VAULT_SECRET_ID}"
                ]) {

                    sh '''
                    set -e

                    echo "Logging into Vault..."

                    jq -n \
                      --arg role "$ROLE_ID" \
                      --arg secret "$SECRET_ID" \
                      '{role_id:$role,secret_id:$secret}' \
                      > login-payload.json

                    echo "===== Login Payload ====="
                    cat login-payload.json

                    curl -s \
                      -X POST \
                      -H "Content-Type: application/json" \
                      --data @login-payload.json \
                      "$VAULT_URL/v1/auth/approle/login" \
                      > login.json

                    echo "===== Vault Login Response ====="
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

        stage('Read Vault Secret') {
            steps {
                withEnv([
                    "VAULT_URL=${params.VAULT_ADDR}"
                ]) {

                    sh '''
                    set -e

                    TOKEN=$(cat vault.token)

                    curl -s \
                      -H "X-Vault-Token: $TOKEN" \
                      "$VAULT_URL/v1/${SECRET_PATH}" \
                      > frontend.json

                    echo "===== Vault Secret ====="
                    cat frontend.json

                    if jq -e '.errors' frontend.json >/dev/null; then
                        echo "Vault returned an error."
                        exit 1
                    fi
                    '''
                }
            }
        }

        stage('Create OKD ConfigMap') {
            steps {
                sh '''
                set -e

                rm -f frontend.env

                # Convert Vault JSON to KEY=VALUE format
                jq -r '.data.data | to_entries[] | "\\(.key)=\\(.value)"' frontend.json > frontend.env

                echo "===== Generated Environment File ====="
                cat frontend.env

                # Delete existing ConfigMap if it exists
                oc delete configmap frontend-config --ignore-not-found=true

                # Create ConfigMap from Vault values
                oc create configmap frontend-config \
                    --from-env-file=frontend.env

                echo "===== ConfigMap Created ====="
                oc describe configmap frontend-config
                '''
            }
        }

        stage('Build Image') {
            steps {
                sh '''
                set -e

                docker build \
                    -t ${REGISTRY}/${PROJECT}/${IMAGE_NAME}:${IMAGE_TAG} \
                    -f frontend/Dockerfile \
                    frontend
                '''
            }
        }

        stage('Push Image') {
            steps {
                sh '''
                set -e

                docker login \
                    -u kubeadmin \
                    -p $(oc whoami -t) \
                    ${REGISTRY}

                docker push \
                    ${REGISTRY}/${PROJECT}/${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                set -e

                # Update deployment image
                oc set image deployment/web \
                    web=${REGISTRY}/${PROJECT}/${IMAGE_NAME}:${IMAGE_TAG}

                # Inject ConfigMap values as environment variables
                oc set env deployment/web --from=configmap/frontend-config

                # Restart deployment
                oc rollout restart deployment/web

                # Wait for rollout to complete
                oc rollout status deployment/web
                '''
            }
        }

    post {
        always {
            sh '''
            rm -f vault.token
            rm -f login.json
            rm -f login-payload.json
            rm -f frontend.json
            rm -f frontend.env
            '''
        }
    }
}