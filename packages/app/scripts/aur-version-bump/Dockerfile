# syntax=docker/dockerfile:experimental
FROM archlinux

RUN pacman -Syu --noconfirm
RUN pacman -S git openssh base-devel sudo --noconfirm

RUN useradd -m -d /build -s /bin/bash build-user
ADD sudoers /etc/sudoers
RUN echo "Set disable_coredump false" >> /etc/sudo.conf

RUN mkdir -m 700 /root/.ssh; \
  touch -m 600 /root/.ssh/known_hosts; \
  ssh-keyscan github.com aur.archlinux.org > /root/.ssh/known_hosts

RUN git config --global user.email "guillaume@mockoon.com"
RUN git config --global user.name "Guillaume Monnet"
RUN git config --global --add safe.directory '*'

RUN --mount=type=ssh,id=default git clone ssh://aur@aur.archlinux.org/mockoon-bin.git /repo

RUN chown build-user /repo

COPY bump /usr/local/bin/
RUN ["chmod", "+x", "/usr/local/bin/bump"]

ENTRYPOINT [ "/usr/local/bin/bump" ]

CMD ["0.0.1"]