## ubuntu 초기 설정

``` console
$ sudo apt-get update
$ sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg |  sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
$ echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

$ sudo apt-get update 
$ sudo apt-get install docker-ce docker-ce-cli containerd.io -y

$ sudo groupadd docker

$ sudo usermod -aG docker $USER

```

## docker swarm 설정 
### 최초 1대에서 init, 나머지 서버는 manager, worker 로 join (최소 3대는 manager 여야 이중화 구성 가능)
### docker group 활성화를 위해 재접속 필요

```console 
$ newgrp docker
$ docker swarm init

Swarm initialized: current node (tst37c3e7v01f5u0i46hfobxp) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-320ghuc2ddfk0abnbrkz9e5273mbtbhfo1186mg1wimq5e4bj5-7tu97d90wcaor7bjg2mzvlsvp 172.31.16.100:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```

### docker image build 및 push
