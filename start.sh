export PORT=80
while [ 1 ]
do
    node server.js >access.log 2>error.log
done
