pipeline {
    agent any

    environment {

        // OKD
        OKD_API = "https://api.crc.testing:6443"
        OKD_PROJECT = "goal"

        // Internal Registry
        REGISTRY = "default-route-openshift-image-registry.apps-crc.testing"

        IMAGE_NAME = "web"
        IMAGE_TAG = "${BUILD_NUMBER}"

        // Vault
        VAULT_ADDR = "http://localhost:8200"

        APP_NAME = "frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Authenticate to Vault') {

            steps {

                withCredentials([
                    string(credentialsId: 'vault-role-id', variable: 'ROLE_ID'),
                    string(credentialsId: 'vault-secret-id', variable: 'SECRET_ID')
                ]) {

                    sh '''

                    LOGIN=$(curl -s \
                      --request POST \
                      --data '{"role_id":"'"$ROLE_ID"'","secret_id":"'"$SECRET_ID"'"}' \
                      $VAULT_ADDR/v1/auth/approle/login)

                    TOKEN=$(echo $LOGIN | jq -r '.auth.client_token')

                    echo $TOKEN > vault.token

                    '''

                }
            }
        }

        stage('Read Secrets From Vault') {

            steps {

                sh '''

                TOKEN=$(cat vault.token)

                curl \
                  -H "X-Vault-Token:$TOKEN" \
                  $VAULT_ADDR/v1/secret/data/frontend \
                  > secrets.json

                '''

            }

        }

        stage('Create .env') {

            steps {

                sh '''

                DATABASE_URL=$(jq -r '.data.data.DATABASE_URL' secrets.json)
                API_URL=$(jq -r '.data.data.API_URL' secrets.json)
                JWT_SECRET=$(jq -r '.data.data.JWT_SECRET' secrets.json)

                cat <<EOF > .env

DATABASE_URL=$DATABASE_URL
API_URL=$API_URL
JWT_SECRET=$JWT_SECRET

EOF

                '''

            }

        }

        stage('Build Image') {

            steps {

                sh '''

                docker build \
                -t $REGISTRY/$OKD_PROJECT/$IMAGE_NAME:$IMAGE_TAG .

                '''

            }

        }

        stage('Login to OKD') {

            steps {

                withCredentials([
                    string(credentialsId: 'okd-token', variable: 'TOKEN')
                ]) {

                    sh '''

                    oc login $OKD_API \
                        --token=$TOKEN \
                        --insecure-skip-tls-verify=true

                    oc project $OKD_PROJECT

                    '''

                }

            }

        }

        stage('Login to Internal Registry') {

            steps {

                withCredentials([
                    string(credentialsId: 'registry-password', variable: 'PASSWORD')
                ]) {

                    sh '''

                    docker login \
                    -u kubeadmin \
                    -p $PASSWORD \
                    $REGISTRY

                    '''

                }

            }

        }

        stage('Push Image') {

            steps {

                sh '''

                docker push \
                $REGISTRY/$OKD_PROJECT/$IMAGE_NAME:$IMAGE_TAG

                '''

            }

        }

        stage('Create Secret From Vault') {

            steps {

                sh '''

                oc delete secret frontend-secret --ignore-not-found

                oc create secret generic frontend-secret \
                  --from-env-file=.env

                '''

            }

        }

        stage('Update Deployment') {

            steps {

                sh '''

                oc set image deployment/web \
                web=$REGISTRY/$OKD_PROJECT/$IMAGE_NAME:$IMAGE_TAG

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
            rm -f secrets.json
            rm -f .env
            '''

        }

    }

}