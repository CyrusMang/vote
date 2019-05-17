FROM mysql:5.7

RUN { \
   echo '[mysqld]'; \
   echo 'explicit_defaults_for_timestamp = 1'; \
} > /etc/mysql/conf.d/charset.cnf

COPY ./seed/ /docker-entrypoint-initdb.d/

EXPOSE 3306