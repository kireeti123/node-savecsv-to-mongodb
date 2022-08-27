FROM node:12-slim

# grab tini for signal processing and zombie killing
ENV TINI_VERSION v0.9.0
RUN set -x \
	&& apt-get update && apt-get install -y ca-certificates curl \
		--no-install-recommends \
	&& apt-get install -y gpg \
	&& curl -fSL "https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini" -o /usr/local/bin/tini \
	&& curl -fSL "https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini.asc" -o /usr/local/bin/tini.asc \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& key=595E85A6B1B4779EA4DAAEC70B588DFF0527A9B7 \
	&& ( gpg --batch --keyserver hkps://keyserver.ubuntu.com --recv-keys "$key" || gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "$key" ) \
	&& gpg --batch --verify /usr/local/bin/tini.asc /usr/local/bin/tini \
	&& rm -r "$GNUPGHOME" /usr/local/bin/tini.asc \
	&& chmod +x /usr/local/bin/tini \
	&& tini -h \
	&& apt-get purge --auto-remove -y ca-certificates curl \
	&& rm -rf /var/lib/apt/lists/*

EXPOSE 4000

WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app

RUN set -x \
	&& apt-get update && apt-get install -y git --no-install-recommends \
	&& npm install \
	&& apt-get purge --auto-remove -y git \
	&& rm -rf /var/lib/apt/lists/*

CMD ["tini", "--", "npm", "start"]