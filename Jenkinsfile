pipeline {
    agent any

    environment {
        OKD_API      = "https://api.crc.testing:6443"
        PROJECT      = "goal"

        REGISTRY     = "default-route-openshift-image-registry.apps-crc.testing"

        IMAGE_NAME   = "web"
        IMAGE_TAG    = "${BUILD_NUMBER}"

        VAULT_ADDR   = "http://localhost:8200"
        SECRET_PATH  = "secret/data/frontend"
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
                    oc login ${OKD_API} \
                      --token=$TOKEN \
                      --insecure-skip-tls-verify=true

                    oc project ${PROJECT}
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

            cat > login-payload.json <<EOF
{
  "role_id": "${ROLE_ID}",
  "secret_id": "${SECRET_ID}"
}
EOF

            echo "===== Login Payload ====="
            cat login-payload.json

            curl -s \
                -X POST \
                -H "Content-Type: application/json" \
                --data @login-payload.json \
                ${VAULT_ADDR}/v1/auth/approle/login \
                > login.json

            echo
            echo "===== Vault Login Response ====="
            cat login.json

            TOKEN=$(jq -r '.auth.client_token // empty' login.json)

            if [ -z "$TOKEN" ]; then
                echo "ERROR: Vault authentication failed."
                exit 1
            fi

            echo "$TOKEN" > vault.token
            '''
        }
    }
}

        stage('Read Vault Secret') {

            steps {

            sh '''
        set -e

        TOKEN=$(cat vault.token)

        curl -s \
            -H "X-Vault-Token: $TOKEN" \
            ${VAULT_ADDR}/v1/${SECRET_PATH} \
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

        stage('Create OKD Secret') {

            steps {

                sh '''
                rm -f frontend.env

                jq -r '.data.data | to_entries[] | "\\(.key)=\\(.value)"' frontend.json \
                    > frontend.env

                oc delete secret frontend-secret --ignore-not-found

                oc create secret generic frontend-secret \
                    --from-env-file=frontend.env
                '''
            }
        }

        stage('Build Image') {

            steps {

                sh '''
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
                oc set image deployment/web \
                  web=${REGISTRY}/${PROJECT}/${IMAGE_NAME}:${IMAGE_TAG}

                oc rollout restart deployment/web

                oc rollout status deployment/web
                '''
            }
        }
    }

    post {

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