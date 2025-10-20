from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Santri, Absensi, SuratIzin


class RegisterSantriAccountSerializer(serializers.ModelSerializer):
    nama = serializers.CharField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    asal_daerah = serializers.CharField(write_only=True)
    sektor = serializers.CharField(write_only=True)
    angkatan = serializers.CharField(write_only=True)
    jenis_kelamin = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['nama', 'asal_daerah', 'sektor', 'angkatan', 'jenis_kelamin', 'username', 'password',]

    def create(self, validated_data):
        nama = validated_data['nama']
        asal_daerah = validated_data['asal_daerah']
        sektor = validated_data['sektor']
        angkatan = validated_data['angkatan']
        jenis_kelamin = validated_data['jenis_kelamin']
        username = validated_data['username']
        password = validated_data['password']
        

        user = User(username=username, first_name=nama, is_staff=False)
        user.set_password(password)
        user.save()

        santri = Santri.objects.create(
            santri_id=f"S{user.id}",
            nama=nama,
            asal_daerah=asal_daerah,
            sektor=sektor,
            angkatan=angkatan,
            jenis_kelamin=jenis_kelamin,
            user=user
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ['id','username','password','is_staff']

    def create(self, validated_data):
        user = User(username=validated_data['username'], is_staff=True)
        user.set_password(validated_data['password'])
        user.save()
        return user

class SantriSerializer(serializers.ModelSerializer):
    class Meta:
        model = Santri
        fields = ['id','santri_id','nama','jenis_kelamin','foto','face_encoding']
        

class AbsensiSerializer(serializers.ModelSerializer):
    santri = SantriSerializer(read_only=True)
    santri_id = serializers.PrimaryKeyRelatedField(queryset=Santri.objects.all(), source='santri', write_only=True)
    class Meta:
        model = Absensi
        fields = ['id','santri','santri_id','tanggal','sesi','waktu_scan','status','created_by']

class SuratIzinSerializer(serializers.ModelSerializer):
    santri = SantriSerializer(read_only=True)
    santri_id = serializers.PrimaryKeyRelatedField(queryset=Santri.objects.all(), source='santri', write_only=True)
    class Meta:
        model = SuratIzin
        fields = ['id','santri','santri_id','tanggal','sesi','file','uploaded_by','uploaded_at','status','note']