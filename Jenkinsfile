pipeline {
    agent any

    environment {
        // Repository and Credentials Definitions
        NEXUS_CREDENTIALS_ID = 'nexus-creds'
        OKD_TOKEN_CREDENTIALS_ID = 'okd-token'
        
        // Nexus Registry Config
        NEXUS_REGISTRY = '192.168.21.116:8081'
        IMAGE_NAME = 'goalgorithm'
        
        // OKD Target Config
        OKD_SERVER = 'https://api.lab.okd.local:6443'
        OKD_PROJECT = 'goalgorithm'
        OKD_DEPLOYMENT = 'goalgorithm'
        OKD_SERVICE = 'goalgorithm'
    }

    stages {
        stage('Checkout & Setup') {
            steps {
                script {
                    checkout scm
                    // Dynamically set execution variables in the env scope
                    env.GIT_COMMIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.BUILD_TAG_BUILD_NUM = "${env.BUILD_NUMBER}"
                    env.BUILD_TAG_GIT_SHA = "git-${env.GIT_COMMIT_SHA}"
                    
                    echo "Starting build #${env.BUILD_NUMBER} for Git SHA: ${env.GIT_COMMIT_SHA}"
                }
            }
        }

        stage('Test Application') {
            steps {
                echo 'Running Python unit tests...'
                sh '''
                    # Setup temporary python virtualenv to test application
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install --no-cache-dir -r backend/requirements.txt
                    pip install --no-cache-dir pytest httpx
                    
                    # Run tests
                    pytest backend/tests/
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image utilizing multi-stage Dockerfile..."
                sh """
                    docker build -t ${env.NEXUS_REGISTRY}/${env.IMAGE_NAME}:${env.BUILD_TAG_BUILD_NUM} \
                                 -t ${env.NEXUS_REGISTRY}/${env.IMAGE_NAME}:${env.BUILD_TAG_GIT_SHA} \
                                 -t ${env.NEXUS_REGISTRY}/${env.IMAGE_NAME}:latest .
                """
            }
        }

        stage('Login to Nexus') {
            steps {
                echo "Logging in to Nexus Docker Registry..."
                withCredentials([usernamePassword(credentialsId: "${env.NEXUS_CREDENTIALS_ID}",
                                                 usernameVariable: 'NEXUS_USER',
                                                 passwordVariable: 'NEXUS_PASS')]) {
                    sh """
                        docker login ${env.NEXUS_REGISTRY} -u \$\$NEXUS_USER -p \$\$NEXUS_PASS
                    """
                }
            }
        }

        stage('Push Image to Nexus') {
            steps {
                echo "Pushing all image tags to Nexus Docker Registry..."
                sh """
                    docker push ${env.NEXUS_REGISTRY}/${env.IMAGE_NAME}:${env.BUILD_TAG_BUILD_NUM}
                    docker push ${env.NEXUS_REGISTRY}/${env.IMAGE_NAME}:${env.BUILD_TAG_GIT_SHA}
                    docker push ${env.NEXUS_REGISTRY}/${env.IMAGE_NAME}:latest
                """
            }
        }

        stage('Deploy to OKD') {
            steps {
                echo "Logging into OKD Cluster and triggering rollout..."
                withCredentials([string(credentialsId: "${env.OKD_TOKEN_CREDENTIALS_ID}", variable: 'OKD_TOKEN')]) {
                    sh """
                        # Authenticate and switch context
                        oc login ${env.OKD_SERVER} --token=\$\$OKD_TOKEN --insecure-skip-tls-verify=true
                        oc project ${env.OKD_PROJECT}
                        
                        # Apply Service and Route configs first
                        oc apply -f deployment/service.yaml
                        oc apply -f deployment/route.yaml
                        
                        # Apply/update deployment schema
                        oc apply -f deployment/deployment.yaml
                        
                        # Set image using the specific build number tag to trigger rolling update
                        oc set image deployment/${env.OKD_DEPLOYMENT} ${env.IMAGE_NAME}=${env.NEXUS_REGISTRY}/${env.IMAGE_NAME}:${env.BUILD_TAG_BUILD_NUM}
                        
                        # Inject deployment annotations to guarantee rollout reload
                        oc patch deployment/${env.OKD_DEPLOYMENT} -p '{"spec":{"template":{"metadata":{"annotations":{"jenkins.build/number":"'${env.BUILD_NUMBER}'"}}}}}'
                    """
                }
            }
        }

        stage('Verify Rollout') {
            steps {
                echo "Verifying Rollout Status on OKD..."
                sh """
                    # Block until deployment rollout is successful
                    oc rollout status deployment/${env.OKD_DEPLOYMENT} --timeout=150s
                    
                    # Display deployment environment assets in console
                    echo "=== OKD Rollout History ==="
                    oc rollout history deployment/${env.OKD_DEPLOYMENT}
                    
                    echo "=== Deployments status ==="
                    oc get deployment ${env.OKD_DEPLOYMENT} -o wide
                    
                    echo "=== Active Pods ==="
                    oc get pods -l app=${env.OKD_DEPLOYMENT}
                    
                    echo "=== Exposed Services ==="
                    oc get svc ${env.OKD_SERVICE}
                    
                    echo "=== Exposed Routes ==="
                    oc get route ${env.OKD_SERVICE}
                """
            }
        }

        stage('Validate Application Route') {
            steps {
                script {
                    echo "Performing HTTP health validation check on exposed OpenShift Route..."
                    // Wait 5 seconds for DNS propagation
                    sleep 5
                    
                    def routeHost = sh(script: "oc get route ${env.OKD_SERVICE} -o jsonpath='{.spec.host}'", returnStdout: true).trim()
                    def routeUrl = "http://${routeHost}"
                    echo "Querying Route Endpoint: ${routeUrl}/health"
                    
                    def response = sh(script: "curl -s -o /dev/null -w '%{http_code}' ${routeUrl}/health", returnStdout: true).trim()
                    if (response != "200") {
                        error "Route healthcheck failed with response code: ${response}"
                    }
                    
                    echo "Pipeline execution verified. Application fully functional and accessible at: ${routeUrl}"
                }
            }
        }
    }

    post {
        always {
            echo "Performing workspace cleanup and logging out..."
            sh """
                # Clean up local image caching from build node if disk space management is needed
                # docker rmi ${env.NEXUS_REGISTRY}/${env.IMAGE_NAME}:${env.BUILD_TAG_BUILD_NUM} || true
                # docker rmi ${env.NEXUS_REGISTRY}/${env.IMAGE_NAME}:${env.BUILD_TAG_GIT_SHA} || true
                docker logout ${env.NEXUS_REGISTRY} || true
            """
        }
        success {
            echo "CI/CD Deployment successful for build #${env.BUILD_NUMBER}!"
        }
        failure {
            echo "CI/CD Pipeline failed! Commencing recovery diagnostic logs extraction..."
            // Extract Kubernetes diagnostics to help developers troubleshoot
            sh """
                echo "=== Diagnostic Logs: OKD Pods ==="
                oc get pods -l app=${env.OKD_DEPLOYMENT} || true
                
                echo "=== Diagnostic Logs: OKD Events ==="
                oc get events -n ${env.OKD_PROJECT} --sort-by='.metadata.creationTimestamp' | tail -n 25 || true
                
                echo "=== Diagnostic Logs: Pod Describe ==="
                oc describe deployment/${env.OKD_DEPLOYMENT} || true
                
                echo "=== Diagnostic Logs: Application Pod Output ==="
                oc logs deployment/${env.OKD_DEPLOYMENT} --tail=100 || true
            """
        }
    }
}