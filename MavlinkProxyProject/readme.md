Installiation steps:
1. Install Docker. 
    https://www.docker.com/get-started
2. Pull mavproxy container
    docker pull asciich/mavproxy
3. Run container with needed serial port shown (example is for my Mac)
    docker run --rm -v $(pwd):/var/log/mavproxy/ --net=host -it asciich/mavproxy /bin/bash -c "run_mavproxy --master=tty.usbmodem14201,115200"
4. ???????? я хз как это запустить