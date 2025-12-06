FROM python:3.11-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libffi-dev \
    gcc \
    g++ \
    gfortran \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libopenblas-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip

ENV OPENBLAS_CORETYPE=NEHALEM
ENV NPY_DISABLE_CPU_FEATURES="AVX AVX2 AVX512F AVX512CD AVX512_SKX AVX512_CLX AVX512_CNL AVX512_ICL"
ENV CFLAGS="-mno-avx -mno-avx2 -march=x86-64"
ENV CXXFLAGS="-mno-avx -mno-avx2 -march=x86-64"

RUN pip install --no-cache-dir meson-python cython setuptools wheel

RUN pip install --no-cache-dir numpy==1.24.3 --no-binary numpy || \
    pip install --no-cache-dir numpy==1.24.3

RUN pip install --no-cache-dir Pillow==9.5.0 --no-binary Pillow || \
    pip install --no-cache-dir Pillow==9.5.0

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8080

CMD ["python", "agent.py", "start"]
